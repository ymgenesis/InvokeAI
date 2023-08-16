## Adaptive EQ 1.0
## A node for InvokeAI, written by YMGenesis/Matthew Janik

from typing import Literal, Optional
from pydantic import BaseModel, Field
import numpy as np
from skimage import exposure
from PIL import Image


from invokeai.app.invocations.baseinvocation import (BaseInvocation,
                                                     BaseInvocationOutput,
                                                     InvocationContext,
                                                     FieldDescriptions,
                                                     InputField,
                                                     tags,
                                                     title)
from invokeai.app.models.image import (ImageCategory, ResourceOrigin)
from invokeai.app.invocations.primitives import ImageField, ImageOutput

@title("Adaptive EQ")
@tags("eq", "adaptive")
class AdaptiveEQInvocation(BaseInvocation):
    """Adaptive Histogram Equalization using skimage."""

    # fmt: off
    type: Literal["adaptive_eq"] = "adaptive_eq"

    # Inputs
    image:       Optional[ImageField]  = Field(default=None, description="Input image")
    strength:    float = Field(default=1.5, description="Adaptive EQ strength")
    # fmt: on


    def invoke(self, context: InvocationContext) -> ImageOutput:
        image = context.services.images.get_pil_image(self.image.image_name)

        if self.strength > 0:
            strength = (self.strength / 222)
            nimage = np.array(image)
            img_adapteq = exposure.equalize_adapthist(nimage, clip_limit=strength)
            image = Image.fromarray((img_adapteq * 255).astype(np.uint8))

        image_dto = context.services.images.create(
            image=image,
            image_origin=ResourceOrigin.INTERNAL,
            image_category=ImageCategory.GENERAL,
            node_id=self.id,
            session_id=context.graph_execution_state_id,
            is_intermediate=self.is_intermediate,
        )

        return ImageOutput(
            image=ImageField(image_name=image_dto.image_name),
            width=image_dto.width,
            height=image_dto.height,
        )
