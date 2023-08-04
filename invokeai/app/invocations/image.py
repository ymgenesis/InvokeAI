# Copyright (c) 2022 Kyle Schouviller (https://github.com/kyle0654)

from typing import Literal, Optional

import numpy
from PIL import Image, ImageFilter, ImageOps, ImageChops
from pathlib import Path
from typing import Union
from invokeai.app.invocations.metadata import CoreMetadata
from ..models.image import (
    ImageCategory,
    ImageField,
    ResourceOrigin,
    ImageOutput,
    MaskOutput,
)
from .baseinvocation import (
    BaseInvocation,
    InputField,
    InvocationContext,
    tags,
    title,
)
from invokeai.backend.image_util.safety_checker import SafetyChecker
from invokeai.backend.image_util.invisible_watermark import InvisibleWatermark


@title("Load Image")
@tags("image")
class LoadImageInvocation(BaseInvocation):
    """Load an image and provide it as output."""

    # Metadata
    type: Literal["load_image"] = "load_image"

    # Inputs
    image: ImageField = InputField(description="The image to load")

    def invoke(self, context: InvocationContext) -> ImageOutput:
        image = context.services.images.get_pil_image(self.image.image_name)

        return ImageOutput(
            image=ImageField(image_name=self.image.image_name),
            width=image.width,
            height=image.height,
        )


@title("Show Image")
@tags("image")
class ShowImageInvocation(BaseInvocation):
    """Displays a provided image, and passes it forward in the pipeline."""

    # Metadata
    type: Literal["show_image"] = "show_image"

    # Inputs
    image: ImageField = InputField(description="The image to show")

    def invoke(self, context: InvocationContext) -> ImageOutput:
        image = context.services.images.get_pil_image(self.image.image_name)
        if image:
            image.show()

        # TODO: how to handle failure?

        return ImageOutput(
            image=ImageField(image_name=self.image.image_name),
            width=image.width,
            height=image.height,
        )


@title("Crop Image")
@tags("image", "crop")
class ImageCropInvocation(BaseInvocation):
    """Crops an image to a specified box. The box can be outside of the image."""

    # Metadata
    type: Literal["img_crop"] = "img_crop"

    # Inputs
    image: ImageField = InputField(description="The image to crop")
    x: int = InputField(default=0, description="The left x coordinate of the crop rectangle")
    y: int = InputField(default=0, description="The top y coordinate of the crop rectangle")
    width: int = InputField(default=512, gt=0, description="The width of the crop rectangle")
    height: int = InputField(default=512, gt=0, description="The height of the crop rectangle")

    def invoke(self, context: InvocationContext) -> ImageOutput:
        image = context.services.images.get_pil_image(self.image.image_name)

        image_crop = Image.new(mode="RGBA", size=(self.width, self.height), color=(0, 0, 0, 0))
        image_crop.paste(image, (-self.x, -self.y))

        image_dto = context.services.images.create(
            image=image_crop,
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


@title("Paste Image")
@tags("image", "paste")
class ImagePasteInvocation(BaseInvocation):
    """Pastes an image into another image."""

    # Metadata
    type: Literal["img_paste"] = "img_paste"

    # Inputs
    base_image: ImageField = InputField(description="The base image")
    image: ImageField = InputField(description="The image to paste")
    mask: Optional[ImageField] = InputField(
        default=None,
        description="The mask to use when pasting",
    )
    x: int = InputField(default=0, description="The left x coordinate at which to paste the image")
    y: int = InputField(default=0, description="The top y coordinate at which to paste the image")

    def invoke(self, context: InvocationContext) -> ImageOutput:
        base_image = context.services.images.get_pil_image(self.base_image.image_name)
        image = context.services.images.get_pil_image(self.image.image_name)
        mask = (
            None if self.mask is None else ImageOps.invert(context.services.images.get_pil_image(self.mask.image_name))
        )
        # TODO: probably shouldn't invert mask here... should user be required to do it?

        min_x = min(0, self.x)
        min_y = min(0, self.y)
        max_x = max(base_image.width, image.width + self.x)
        max_y = max(base_image.height, image.height + self.y)

        new_image = Image.new(mode="RGBA", size=(max_x - min_x, max_y - min_y), color=(0, 0, 0, 0))
        new_image.paste(base_image, (abs(min_x), abs(min_y)))
        new_image.paste(image, (max(0, self.x), max(0, self.y)), mask=mask)

        image_dto = context.services.images.create(
            image=new_image,
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


@title("Mask from Alpha")
@tags("image", "mask")
class MaskFromAlphaInvocation(BaseInvocation):
    """Extracts the alpha channel of an image as a mask."""

    # Metadata
    type: Literal["tomask"] = "tomask"

    # Inputs
    image: ImageField = InputField(description="The image to create the mask from")
    invert: bool = InputField(default=False, description="Whether or not to invert the mask")

    def invoke(self, context: InvocationContext) -> MaskOutput:
        image = context.services.images.get_pil_image(self.image.image_name)

        image_mask = image.split()[-1]
        if self.invert:
            image_mask = ImageOps.invert(image_mask)

        image_dto = context.services.images.create(
            image=image_mask,
            image_origin=ResourceOrigin.INTERNAL,
            image_category=ImageCategory.MASK,
            node_id=self.id,
            session_id=context.graph_execution_state_id,
            is_intermediate=self.is_intermediate,
        )

        return MaskOutput(
            mask=ImageField(image_name=image_dto.image_name),
            width=image_dto.width,
            height=image_dto.height,
        )


@title("Multiply Images")
@tags("image", "multiply")
class ImageMultiplyInvocation(BaseInvocation):
    """Multiplies two images together using `PIL.ImageChops.multiply()`."""

    # Metadata
    type: Literal["img_mul"] = "img_mul"

    # Inputs
    image1: ImageField = InputField(description="The first image to multiply")
    image2: ImageField = InputField(description="The second image to multiply")

    def invoke(self, context: InvocationContext) -> ImageOutput:
        image1 = context.services.images.get_pil_image(self.image1.image_name)
        image2 = context.services.images.get_pil_image(self.image2.image_name)

        multiply_image = ImageChops.multiply(image1, image2)

        image_dto = context.services.images.create(
            image=multiply_image,
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


IMAGE_CHANNELS = Literal["A", "R", "G", "B"]


@title("Extract Image Channel")
@tags("image", "channel")
class ImageChannelInvocation(BaseInvocation):
    """Gets a channel from an image."""

    # Metadata
    type: Literal["img_chan"] = "img_chan"

    # Inputs
    image: ImageField = InputField(description="The image to get the channel from")
    channel: IMAGE_CHANNELS = InputField(default="A", description="The channel to get")

    def invoke(self, context: InvocationContext) -> ImageOutput:
        image = context.services.images.get_pil_image(self.image.image_name)

        channel_image = image.getchannel(self.channel)

        image_dto = context.services.images.create(
            image=channel_image,
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


IMAGE_MODES = Literal["L", "RGB", "RGBA", "CMYK", "YCbCr", "LAB", "HSV", "I", "F"]


@title("Convert Image Mode")
@tags("image", "convert")
class ImageConvertInvocation(BaseInvocation):
    """Converts an image to a different mode."""

    # Metadata
    type: Literal["img_conv"] = "img_conv"

    # Inputs
    image: ImageField = InputField(description="The image to convert")
    mode: IMAGE_MODES = InputField(default="L", description="The mode to convert to")

    def invoke(self, context: InvocationContext) -> ImageOutput:
        image = context.services.images.get_pil_image(self.image.image_name)

        converted_image = image.convert(self.mode)

        image_dto = context.services.images.create(
            image=converted_image,
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


@title("Blur Image")
@tags("image", "blur")
class ImageBlurInvocation(BaseInvocation):
    """Blurs an image"""

    # Metadata
    type: Literal["img_blur"] = "img_blur"

    # Inputs
    image: ImageField = InputField(description="The image to blur")
    radius: float = InputField(default=8.0, ge=0, description="The blur radius")
    # Metadata
    blur_type: Literal["gaussian", "box"] = InputField(default="gaussian", description="The type of blur")

    def invoke(self, context: InvocationContext) -> ImageOutput:
        image = context.services.images.get_pil_image(self.image.image_name)

        blur = (
            ImageFilter.GaussianBlur(self.radius) if self.blur_type == "gaussian" else ImageFilter.BoxBlur(self.radius)
        )
        blur_image = image.filter(blur)

        image_dto = context.services.images.create(
            image=blur_image,
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


PIL_RESAMPLING_MODES = Literal[
    "nearest",
    "box",
    "bilinear",
    "hamming",
    "bicubic",
    "lanczos",
]


PIL_RESAMPLING_MAP = {
    "nearest": Image.Resampling.NEAREST,
    "box": Image.Resampling.BOX,
    "bilinear": Image.Resampling.BILINEAR,
    "hamming": Image.Resampling.HAMMING,
    "bicubic": Image.Resampling.BICUBIC,
    "lanczos": Image.Resampling.LANCZOS,
}


@title("Resize Image")
@tags("image", "resize")
class ImageResizeInvocation(BaseInvocation):
    """Resizes an image to specific dimensions"""

    # Metadata
    type: Literal["img_resize"] = "img_resize"

    # Inputs
    image: ImageField = InputField(description="The image to resize")
    width: int = InputField(default=512, ge=64, multiple_of=8, description="The width to resize to (px)")
    height: int = InputField(default=512, ge=64, multiple_of=8, description="The height to resize to (px)")
    resample_mode: PIL_RESAMPLING_MODES = InputField(default="bicubic", description="The resampling mode")

    def invoke(self, context: InvocationContext) -> ImageOutput:
        image = context.services.images.get_pil_image(self.image.image_name)

        resample_mode = PIL_RESAMPLING_MAP[self.resample_mode]

        resize_image = image.resize(
            (self.width, self.height),
            resample=resample_mode,
        )

        image_dto = context.services.images.create(
            image=resize_image,
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


@title("Scale Image")
@tags("image", "scale")
class ImageScaleInvocation(BaseInvocation):
    """Scales an image by a factor"""

    # Metadata
    type: Literal["img_scale"] = "img_scale"

    # Inputs
    image: ImageField = InputField(description="The image to scale")
    scale_factor: float = InputField(
        default=2.0,
        gt=0,
        description="The factor by which to scale the image",
    )
    resample_mode: PIL_RESAMPLING_MODES = InputField(default="bicubic", description="The resampling mode")

    def invoke(self, context: InvocationContext) -> ImageOutput:
        image = context.services.images.get_pil_image(self.image.image_name)

        resample_mode = PIL_RESAMPLING_MAP[self.resample_mode]
        width = int(image.width * self.scale_factor)
        height = int(image.height * self.scale_factor)

        resize_image = image.resize(
            (width, height),
            resample=resample_mode,
        )

        image_dto = context.services.images.create(
            image=resize_image,
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


@title("Lerp Image")
@tags("image", "lerp")
class ImageLerpInvocation(BaseInvocation):
    """Linear interpolation of all pixels of an image"""

    # Metadata
    type: Literal["img_lerp"] = "img_lerp"

    # Inputs
    image: ImageField = InputField(description="The image to lerp")
    min: int = InputField(default=0, ge=0, le=255, description="The minimum output value")
    max: int = InputField(default=255, ge=0, le=255, description="The maximum output value")

    def invoke(self, context: InvocationContext) -> ImageOutput:
        image = context.services.images.get_pil_image(self.image.image_name)

        image_arr = numpy.asarray(image, dtype=numpy.float32) / 255
        image_arr = image_arr * (self.max - self.min) + self.max

        lerp_image = Image.fromarray(numpy.uint8(image_arr))

        image_dto = context.services.images.create(
            image=lerp_image,
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


@title("Inverse Lerp Image")
@tags("image", "ilerp")
class ImageInverseLerpInvocation(BaseInvocation):
    """Inverse linear interpolation of all pixels of an image"""

    # Metadata
    type: Literal["img_ilerp"] = "img_ilerp"

    # Inputs
    image: ImageField = InputField(description="The image to lerp")
    min: int = InputField(default=0, ge=0, le=255, description="The minimum input value")
    max: int = InputField(default=255, ge=0, le=255, description="The maximum input value")

    def invoke(self, context: InvocationContext) -> ImageOutput:
        image = context.services.images.get_pil_image(self.image.image_name)

        image_arr = numpy.asarray(image, dtype=numpy.float32)
        image_arr = numpy.minimum(numpy.maximum(image_arr - self.min, 0) / float(self.max - self.min), 1) * 255

        ilerp_image = Image.fromarray(numpy.uint8(image_arr))

        image_dto = context.services.images.create(
            image=ilerp_image,
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


@title("Blur NSFW Image")
@tags("image", "nsfw")
class ImageNSFWBlurInvocation(BaseInvocation):
    """Add blur to NSFW-flagged images"""

    # Metadata
    type: Literal["img_nsfw"] = "img_nsfw"

    # Inputs
    image: ImageField = InputField(description="The image to check")
    metadata: Optional[CoreMetadata] = InputField(
        default=None, description="Optional core metadata to be written to the image", ui_hidden=True
    )

    def invoke(self, context: InvocationContext) -> ImageOutput:
        image = context.services.images.get_pil_image(self.image.image_name)

        logger = context.services.logger
        logger.debug("Running NSFW checker")
        if SafetyChecker.has_nsfw_concept(image):
            logger.info("A potentially NSFW image has been detected. Image will be blurred.")
            blurry_image = image.filter(filter=ImageFilter.GaussianBlur(radius=32))
            caution = self._get_caution_img()
            blurry_image.paste(caution, (0, 0), caution)
            image = blurry_image

        image_dto = context.services.images.create(
            image=image,
            image_origin=ResourceOrigin.INTERNAL,
            image_category=ImageCategory.GENERAL,
            node_id=self.id,
            session_id=context.graph_execution_state_id,
            is_intermediate=self.is_intermediate,
            metadata=self.metadata.dict() if self.metadata else None,
        )

        return ImageOutput(
            image=ImageField(image_name=image_dto.image_name),
            width=image_dto.width,
            height=image_dto.height,
        )

    def _get_caution_img(self) -> Image:
        import invokeai.app.assets.images as image_assets

        caution = Image.open(Path(image_assets.__path__[0]) / "caution.png")
        return caution.resize((caution.width // 2, caution.height // 2))


@title("Add Invisible Watermark")
@tags("image", "watermark")
class ImageWatermarkInvocation(BaseInvocation):
    """Add an invisible watermark to an image"""

    # Metadata
    type: Literal["img_watermark"] = "img_watermark"

    # Inputs
    image: ImageField = InputField(description="The image to check")
    text: str = InputField(default="InvokeAI", description="Watermark text")
    metadata: Optional[CoreMetadata] = InputField(
        default=None, description="Optional core metadata to be written to the image", ui_hidden=True
    )

    def invoke(self, context: InvocationContext) -> ImageOutput:
        image = context.services.images.get_pil_image(self.image.image_name)
        new_image = InvisibleWatermark.add_watermark(image, self.text)
        image_dto = context.services.images.create(
            image=new_image,
            image_origin=ResourceOrigin.INTERNAL,
            image_category=ImageCategory.GENERAL,
            node_id=self.id,
            session_id=context.graph_execution_state_id,
            is_intermediate=self.is_intermediate,
            metadata=self.metadata.dict() if self.metadata else None,
        )

        return ImageOutput(
            image=ImageField(image_name=image_dto.image_name),
            width=image_dto.width,
            height=image_dto.height,
        )
