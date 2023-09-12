## Remove Transparencies 1.0
## A node for InvokeAI, written by YMGenesis/Matthew Janik

from PIL import Image
from invokeai.app.models.image import (ImageCategory, ResourceOrigin)
from invokeai.app.invocations.primitives import ImageField, ImageOutput
from invokeai.app.invocations.baseinvocation import (
    BaseInvocation,
    InvocationContext,
    InputField,
    invocation,
    )

@invocation("remove_transparencies", title="Remove Transparencies", tags=["image", "remove", "transparencies", "crop"], category="image", version="1.0.0")
class RemoveTransparenciesInvocation(BaseInvocation):
    """Outputs an image with transparent pixels removed. Uses a transparency threshold to identify pixels for removal. Optionally crop to remaining pixels with a transparent border (px)."""

    image:                      ImageField  = InputField(description="Image to remove transparencies from")
    transparency_threshold:     float = InputField(default="0.5", description="Transparency threshold pixels meet to be removed. 0 = transparent, 1 = opaque.")
    crop:                       bool = InputField(default=False, description="Whether to crop to remaining pixels")
    border:                     int = InputField(default="0", description="If cropping, the transparent border (px) to draw around cropped area")

    def invoke(self, context: InvocationContext) -> ImageOutput:
        image = context.services.images.get_pil_image(self.image.image_name)
        image = image.convert("RGBA")

        # Remove pixels based on the transparency threshold
        pixels = image.load()
        width, height = image.size
        for x in range(width):
            for y in range(height):
                r, g, b, a = pixels[x, y]
                if a / 255.0 < self.transparency_threshold:
                    pixels[x, y] = (0, 0, 0, 0)

        if self.crop:
            # box and crop
            bbox = image.getbbox()
            image = image.crop(bbox)
            (width, height) = image.size
            # border
            width += self.border * 2
            height += self.border * 2
            border = self.border
        else:
            # no border if cropping isn't true
            border = 0
        
        # Create a new image object for the output image
        image_out = Image.new("RGBA", (width, height), (0, 0, 0, 0))
        # Paste the cropped image onto the new image
        image_out.paste(image, (border, border))

        image_dto = context.services.images.create(
            image=image_out,
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
