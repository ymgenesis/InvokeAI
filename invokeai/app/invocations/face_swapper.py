import gc
import pathlib
from typing import Optional

import cv2
import insightface
import numpy as np
import requests
import torch
from invokeai.app.invocations.baseinvocation import (BaseInvocation,
                                                     InputField,
                                                     InvocationContext,
                                                     invocation,
                                                     )
from invokeai.app.models.image import ImageCategory, ResourceOrigin
from invokeai.app.invocations.primitives import ImageField, ImageOutput
from PIL import Image
from PIL.Image import Image as ImageType
from tqdm import tqdm


@invocation("face_swapper", title="Face Swapper", tags=["image", "face", "swap"], category="image", version="1.0.0")
class FaceSwapperInvocation(BaseInvocation):
    '''Replace face using InsightFace'''

    image: Optional[ImageField] = InputField(default=None, description='Image that you want to replace the face from')
    face: Optional[ImageField] = InputField(default=None, description='Face you want to replace with')

    def get_provider(self):
        if torch.cuda.is_available():
            return ['CUDAExecutionProvider', 'CPUExecutionProvider']
        return ['CPUExecutionProvider']

    def make_cv2_image(self, image: ImageType):
        cv2_image = np.array(image)
        cv2_image = cv2_image[:, :, ::-1]
        cv2_image = cv2_image[:, :, :3]
        return cv2_image

    def download_model(self, url, file_name):
        r = requests.get(url, stream=True)
        total_size = int(r.headers.get('content-length', 0))
        with open(file_name, 'wb') as f:
            for chunk in tqdm(r.iter_content(chunk_size=1024), total=total_size, unit='iB', unit_scale=True):
                if chunk:
                    f.write(chunk)

    def invoke(self, context: InvocationContext) -> ImageOutput:
        image = context.services.images.get_pil_image(self.image.image_name)
        swapped_image = image
        image = self.make_cv2_image(image)

        face = context.services.images.get_pil_image(self.face.image_name)
        face = self.make_cv2_image(face)

        providers = self.get_provider()

        # Create models directory if it does not exist
        models_dir = pathlib.Path(__file__).parent / 'models'
        if not models_dir.is_dir():
            models_dir.mkdir(exist_ok=True)

        # Initializing The Analyzer
        context.services.logger.info('Initializing Face Analyzer..')
        insightface_analyzer_path = pathlib.Path(__file__).parent / 'models/insightface'
        face_analyser = insightface.app.FaceAnalysis(name='buffalo_l', root=insightface_analyzer_path, providers=providers)
        face_analyser.prepare(0)

        # Initializing The Swapper
        insightface_model_path_url = 'https://drive.google.com/uc?id=1krOLgjW2tAPaqV-Bw4YALz0xT5zlb5HF&export=download&confirm=t&uuid=79350c38-25d6-4883-8b3a-dca93d5b7cc3'
        insightface_model_path = pathlib.Path(__file__).parent / 'models/inswapper_128.onnx'
        if not insightface_model_path.is_file():
            context.services.logger.warning('Model Missing. Downloading. Please wait..')
            self.download_model(insightface_model_path_url, insightface_model_path)
        context.services.logger.info('Initializing Face Swapper..')
        face_swapper = insightface.model_zoo.get_model(insightface_model_path.as_posix(), providers=providers)

        # Search For Faces
        source_face = face_analyser.get(image)
        if not source_face:
            context.services.logger.warning('No faces found in source image')
            output_image = context.services.images.create(
                image=swapped_image,
                image_origin=ResourceOrigin.INTERNAL,
                image_category=ImageCategory.GENERAL,
                node_id=self.id,
                session_id=context.graph_execution_state_id,
                is_intermediate=self.is_intermediate,
            )
            return ImageOutput(
                image=output_image,
                width=output_image.width,
                height=output_image.height
            )


        target_face = face_analyser.get(face)
        if not target_face:
            context.services.logger.warning('No faces found in target image')
            output_image = context.services.images.create(
                image=swapped_image,
                image_origin=ResourceOrigin.INTERNAL,
                image_category=ImageCategory.GENERAL,
                node_id=self.id,
                session_id=context.graph_execution_state_id,
                is_intermediate=self.is_intermediate,
            )
            return ImageOutput(
                image=output_image,
                width=output_image.width,
                height=output_image.height
            )

        context.services.logger.info('Swapping Faces...')
        swapped_image = face_swapper.get(image, source_face[0], target_face[0], paste_back=True)
        swapped_image = cv2.cvtColor(swapped_image, cv2.COLOR_BGR2RGB)
        swapped_image = Image.fromarray(swapped_image)

        swapped_pil_image = context.services.images.create(
            image=swapped_image,
            image_origin=ResourceOrigin.INTERNAL,
            image_category=ImageCategory.GENERAL,
            node_id=self.id,
            session_id=context.graph_execution_state_id,
            is_intermediate=self.is_intermediate,
        )

        del face_swapper
        del face_analyser
        gc.collect()

        return ImageOutput(
            image=swapped_pil_image,
            width=swapped_pil_image.width,
            height=swapped_pil_image.height
        )

