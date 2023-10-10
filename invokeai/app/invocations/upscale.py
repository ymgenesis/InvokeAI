# Copyright (c) 2022 Kyle Schouviller (https://github.com/kyle0654) & the InvokeAI Team
from pathlib import Path
from typing import Literal

import cv2 as cv
import numpy as np
import torch
from basicsr.archs.rrdbnet_arch import RRDBNet
from PIL import Image
from realesrgan import RealESRGANer

from invokeai.app.invocations.primitives import ImageField, ImageOutput
from invokeai.app.models.image import ImageCategory, ResourceOrigin
from invokeai.backend.util.devices import choose_torch_device

from .baseinvocation import BaseInvocation, InputField, InvocationContext, invocation

# TODO: Populate this from disk?
# TODO: Use model manager to load?
ESRGAN_MODELS = Literal[
    "RealESRGAN_x4plus.pth",
    "RealESRGAN_x4plus_anime_6B.pth",
    "ESRGAN_SRx4_DF2KOST_official-ff704c30.pth",
    "RealESRGAN_x2plus.pth",
]

if choose_torch_device() == torch.device("mps"):
    from torch import mps


@invocation("esrgan", title="Upscale (RealESRGAN)", tags=["esrgan", "upscale"], category="esrgan", version="1.1.0")
class ESRGANInvocation(BaseInvocation):
    """Upscales an image using RealESRGAN."""

    image: ImageField = InputField(description="The input image")
    model_name: ESRGAN_MODELS = InputField(default="RealESRGAN_x4plus.pth", description="The Real-ESRGAN model to use")
    tile_size: int = InputField(
        default=400, ge=0, description="Tile size for tiled ESRGAN upscaling (0=tiling disabled)"
    )

    def invoke(self, context: InvocationContext) -> ImageOutput:
        image = context.services.images.get_pil_image(self.image.image_name)
        models_path = context.services.configuration.models_path

        rrdbnet_model = None
        netscale = None
        esrgan_model_path = None

        if self.model_name in [
            "RealESRGAN_x4plus.pth",
            "ESRGAN_SRx4_DF2KOST_official-ff704c30.pth",
        ]:
            # x4 RRDBNet model
            rrdbnet_model = RRDBNet(
                num_in_ch=3,
                num_out_ch=3,
                num_feat=64,
                num_block=23,
                num_grow_ch=32,
                scale=4,
            )
            netscale = 4
        elif self.model_name in ["RealESRGAN_x4plus_anime_6B.pth"]:
            # x4 RRDBNet model, 6 blocks
            rrdbnet_model = RRDBNet(
                num_in_ch=3,
                num_out_ch=3,
                num_feat=64,
                num_block=6,  # 6 blocks
                num_grow_ch=32,
                scale=4,
            )
            netscale = 4
        elif self.model_name in ["RealESRGAN_x2plus.pth"]:
            # x2 RRDBNet model
            rrdbnet_model = RRDBNet(
                num_in_ch=3,
                num_out_ch=3,
                num_feat=64,
                num_block=23,
                num_grow_ch=32,
                scale=2,
            )
            netscale = 2
        else:
            msg = f"Invalid RealESRGAN model: {self.model_name}"
            context.services.logger.error(msg)
            raise ValueError(msg)

        esrgan_model_path = Path(f"core/upscaling/realesrgan/{self.model_name}")

        upsampler = RealESRGANer(
            scale=netscale,
            model_path=str(models_path / esrgan_model_path),
            model=rrdbnet_model,
            half=False,
            tile=self.tile_size,
        )

        # prepare image - Real-ESRGAN uses cv2 internally, and cv2 uses BGR vs RGB for PIL
        # TODO: This strips the alpha... is that okay?
        cv_image = cv.cvtColor(np.array(image.convert("RGB")), cv.COLOR_RGB2BGR)

        # We can pass an `outscale` value here, but it just resizes the image by that factor after
        # upscaling, so it's kinda pointless for our purposes. If you want something other than 4x
        # upscaling, you'll need to add a resize node after this one.
        upscaled_image, img_mode = upsampler.enhance(cv_image)

        # back to PIL
        pil_image = Image.fromarray(cv.cvtColor(upscaled_image, cv.COLOR_BGR2RGB)).convert("RGBA")

        torch.cuda.empty_cache()
        if choose_torch_device() == torch.device("mps"):
            mps.empty_cache()

        image_dto = context.services.images.create(
            image=pil_image,
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
