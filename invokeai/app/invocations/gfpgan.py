from typing import Literal

import cv2
import numpy as np
from PIL import Image

from gfpgan import GFPGANer
from invokeai.app.invocations.baseinvocation import BaseInvocation, InputField, InvocationContext, invocation
from invokeai.app.invocations.primitives import ImageField, ImageOutput
from invokeai.app.models.image import ImageCategory, ResourceOrigin

archs = Literal[
    "clean",
    "bilinear",
    "original",
    "RestoreFormer",
]


@invocation(
    "gfpgan_face_restoration",
    title="GFPGAN",
    tags=["image", "gfpgan", "face", "restoration"],
    category="image",
    version="1.0.0",
)
class GfpganInvocation(BaseInvocation):
    """Face Restoration using GFPGAN."""

    image: ImageField = InputField(description="Input image")
    strength: float = InputField(default=0.5, description="Restoration strength")
    upscale: int = InputField(default=1, description="Upscale multiplier")

    def invoke(self, context: InvocationContext) -> ImageOutput:
        image = context.services.images.get_pil_image(self.image.image_name)
        models_path = context.services.configuration.models_path
        model_path = f"{models_path}/core/face_restoration/gfpgan/GFPGANv1.4.pth"

        gfpgan = GFPGANer(
            model_path=model_path,
            upscale=self.upscale,
            arch="clean",
            channel_multiplier=2,
            bg_upsampler=None,
        )

        # GFPGAN expects BGR image data
        bgrImage = cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR)

        _, _, restored_img = gfpgan.enhance(
            bgrImage,
            has_aligned=False,
            only_center_face=False,
            paste_back=True,
        )

        # Convert back to RGB for PIL
        res = Image.fromarray(cv2.cvtColor(restored_img, cv2.COLOR_BGR2RGB))

        if self.strength < 1.0:
            # Resize the image to the new image if the sizes have changed
            if restored_img.size != image.size:
                image = image.resize(res.size)
            res = Image.blend(image, res, self.strength)

        image_dto = context.services.images.create(
            image=res,
            image_origin=ResourceOrigin.INTERNAL,
            image_category=ImageCategory.GENERAL,
            node_id=self.id,
            session_id=context.graph_execution_state_id,
            is_intermediate=self.is_intermediate,
            workflow=self.workflow,
        )

        return ImageOutput(
            image=ImageField(image_name=image_dto.image_name),
            width=image_dto.width,
            height=image_dto.height,
        )
