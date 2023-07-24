from typing import Literal, Optional

from PIL import Image
from pydantic import BaseModel, Field
import cv2

from invokeai.app.models.image import ImageCategory, ImageField, ResourceOrigin
from invokeai.app.invocations.baseinvocation import (
    BaseInvocation,
    BaseInvocationOutput,
    InvocationContext,
    InvocationConfig,
)


class PILInvocationConfig(BaseModel):
    """Helper class to provide all PIL invocations with additional config"""

    class Config(InvocationConfig):
        schema_extra = {
            "ui": {
                "tags": ["PIL", "image"],
            },
        }


class ImagePlaceOutput(BaseInvocationOutput):
    """Base class for invocations that output the image with the inpainted face placed on the original image"""

    # fmt: off
    type: Literal["image_place_output"] = "image_place_output"
    image:             ImageField = Field(default=None, description="The image with the inpainted face placed on the original image")
    width:             int = Field(description="The width of the image in pixels")
    height:            int = Field(description="The height of the image in pixels")
    # fmt: on

    class Config:
        schema_extra = {"required": ["type", "image", "width", "height"]}


class FacePlaceInvocation(BaseInvocation, PILInvocationConfig):
    """FacePlace node to place the inpainted face back onto the original image"""

    # fmt: off
    type: Literal["face_place"] = "face_place"

    # Inputs
    inpainted_image:   ImageField = Field(default=None, description="The inpainted image to be placed on the original image")
    original_image:    ImageField = Field(default=None, description="The original image to place the inpainted image on")
    downscale_factor:  int = Field(default=2, description="Factor to downscale the inpainted image")
    x:                 int = Field(default=0, description="The x coordinate (top left corner) to place the inpainted image")
    y:                 int = Field(default=0, description="The y coordinate (top left corner) to place the inpainted image")
    # fmt: on

    class Config(InvocationConfig):
        schema_extra = {
            "ui": {
                "title": "Face Place",
                "tags": ["image", "face", "place"],
            },
        }

    def create_alpha_mask(self, image):
        # Check the image mode to determine if it has an alpha channel.
        if image.mode == "RGBA":
            try:
                alpha = image.getchannel("A")  # Get the alpha channel (assuming RGBA image)
            except ValueError:
                raise ValueError("The image has no alpha channel (A).")
        else:
            # If the image is not in RGBA mode (e.g., RGB mode), create a mask of all opaque (white).
            alpha = Image.new("L", image.size, 255)

        return alpha

    def invoke(self, context: InvocationContext) -> ImagePlaceOutput:
        inpainted_image = context.services.images.get_pil_image(self.inpainted_image.image_name)
        original_image = context.services.images.get_pil_image(self.original_image.image_name)

        # Downscale the inpainted image by the given factor.
        if self.downscale_factor > 0:
            new_size = (int(inpainted_image.width / self.downscale_factor), int(inpainted_image.height / self.downscale_factor))
            inpainted_image = inpainted_image.resize(new_size)

        # Get the coordinates for placing the inpainted image on the original image.
        x_coord = self.x
        y_coord = self.y

        # Ensure the placement coordinates are within the bounds of the original image.
        x_max = x_coord + inpainted_image.width
        y_max = y_coord + inpainted_image.height
        if x_max > original_image.width:
            x_coord = original_image.width - inpainted_image.width
        if y_max > original_image.height:
            y_coord = original_image.height - inpainted_image.height

        # Create an alpha mask for the inpainted image.
        inpainted_alpha_mask = self.create_alpha_mask(inpainted_image)

        # Create a copy of the original image.
        placed_image = original_image.copy()

        # Paste the inpainted image on the original image.
        placed_image.paste(inpainted_image, (x_coord, y_coord), inpainted_alpha_mask)

        placed_image_dto = context.services.images.create(
            image=placed_image,
            image_origin=ResourceOrigin.INTERNAL,
            image_category=ImageCategory.GENERAL,
            node_id=self.id,
            session_id=context.graph_execution_state_id,
            is_intermediate=False,
        )

        return ImagePlaceOutput(
            image=ImageField(image_name=placed_image_dto.image_name),
            width=placed_image_dto.width,
            height=placed_image_dto.height,
        )
