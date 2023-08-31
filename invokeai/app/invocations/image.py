# Copyright (c) 2022 Kyle Schouviller (https://github.com/kyle0654)

from pathlib import Path
from typing import Literal, Optional

import cv2
import numpy
from PIL import Image, ImageChops, ImageFilter, ImageOps

from invokeai.app.invocations.metadata import CoreMetadata
from invokeai.app.invocations.primitives import ColorField, ImageField, ImageOutput
from invokeai.backend.image_util.invisible_watermark import InvisibleWatermark
from invokeai.backend.image_util.safety_checker import SafetyChecker

from ..models.image import ImageCategory, ResourceOrigin
from .baseinvocation import BaseInvocation, FieldDescriptions, InputField, InvocationContext, invocation


@invocation("show_image", title="Show Image", tags=["image"], category="image")
class ShowImageInvocation(BaseInvocation):
    """Displays a provided image using the OS image viewer, and passes it forward in the pipeline."""

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


@invocation("blank_image", title="Blank Image", tags=["image"], category="image")
class BlankImageInvocation(BaseInvocation):
    """Creates a blank image and forwards it to the pipeline"""

    width: int = InputField(default=512, description="The width of the image")
    height: int = InputField(default=512, description="The height of the image")
    mode: Literal["RGB", "RGBA"] = InputField(default="RGB", description="The mode of the image")
    color: ColorField = InputField(default=ColorField(r=0, g=0, b=0, a=255), description="The color of the image")

    def invoke(self, context: InvocationContext) -> ImageOutput:
        image = Image.new(mode=self.mode, size=(self.width, self.height), color=self.color.tuple())

        image_dto = context.services.images.create(
            image=image,
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


@invocation("img_crop", title="Crop Image", tags=["image", "crop"], category="image")
class ImageCropInvocation(BaseInvocation):
    """Crops an image to a specified box. The box can be outside of the image."""

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
            workflow=self.workflow,
        )

        return ImageOutput(
            image=ImageField(image_name=image_dto.image_name),
            width=image_dto.width,
            height=image_dto.height,
        )


@invocation("img_paste", title="Paste Image", tags=["image", "paste"], category="image")
class ImagePasteInvocation(BaseInvocation):
    """Pastes an image into another image."""

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
        mask = None
        if self.mask is not None:
            mask = context.services.images.get_pil_image(self.mask.image_name)
            mask = ImageOps.invert(mask.convert("L"))
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
            workflow=self.workflow,
        )

        return ImageOutput(
            image=ImageField(image_name=image_dto.image_name),
            width=image_dto.width,
            height=image_dto.height,
        )


@invocation("tomask", title="Mask from Alpha", tags=["image", "mask"], category="image")
class MaskFromAlphaInvocation(BaseInvocation):
    """Extracts the alpha channel of an image as a mask."""

    image: ImageField = InputField(description="The image to create the mask from")
    invert: bool = InputField(default=False, description="Whether or not to invert the mask")

    def invoke(self, context: InvocationContext) -> ImageOutput:
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
            workflow=self.workflow,
        )

        return ImageOutput(
            image=ImageField(image_name=image_dto.image_name),
            width=image_dto.width,
            height=image_dto.height,
        )


@invocation("img_mul", title="Multiply Images", tags=["image", "multiply"], category="image")
class ImageMultiplyInvocation(BaseInvocation):
    """Multiplies two images together using `PIL.ImageChops.multiply()`."""

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
            workflow=self.workflow,
        )

        return ImageOutput(
            image=ImageField(image_name=image_dto.image_name),
            width=image_dto.width,
            height=image_dto.height,
        )


IMAGE_CHANNELS = Literal["A", "R", "G", "B"]


@invocation("img_chan", title="Extract Image Channel", tags=["image", "channel"], category="image")
class ImageChannelInvocation(BaseInvocation):
    """Gets a channel from an image."""

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
            workflow=self.workflow,
        )

        return ImageOutput(
            image=ImageField(image_name=image_dto.image_name),
            width=image_dto.width,
            height=image_dto.height,
        )


IMAGE_MODES = Literal["L", "RGB", "RGBA", "CMYK", "YCbCr", "LAB", "HSV", "I", "F"]


@invocation("img_conv", title="Convert Image Mode", tags=["image", "convert"], category="image")
class ImageConvertInvocation(BaseInvocation):
    """Converts an image to a different mode."""

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
            workflow=self.workflow,
        )

        return ImageOutput(
            image=ImageField(image_name=image_dto.image_name),
            width=image_dto.width,
            height=image_dto.height,
        )


@invocation("img_blur", title="Blur Image", tags=["image", "blur"], category="image")
class ImageBlurInvocation(BaseInvocation):
    """Blurs an image"""

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
            workflow=self.workflow,
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


@invocation("img_resize", title="Resize Image", tags=["image", "resize"], category="image")
class ImageResizeInvocation(BaseInvocation):
    """Resizes an image to specific dimensions"""

    image: ImageField = InputField(description="The image to resize")
    width: int = InputField(default=512, ge=64, multiple_of=8, description="The width to resize to (px)")
    height: int = InputField(default=512, ge=64, multiple_of=8, description="The height to resize to (px)")
    resample_mode: PIL_RESAMPLING_MODES = InputField(default="bicubic", description="The resampling mode")
    metadata: Optional[CoreMetadata] = InputField(
        default=None, description=FieldDescriptions.core_metadata, ui_hidden=True
    )

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
            metadata=self.metadata.dict() if self.metadata else None,
            workflow=self.workflow,
        )

        return ImageOutput(
            image=ImageField(image_name=image_dto.image_name),
            width=image_dto.width,
            height=image_dto.height,
        )


@invocation("img_scale", title="Scale Image", tags=["image", "scale"], category="image")
class ImageScaleInvocation(BaseInvocation):
    """Scales an image by a factor"""

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
            workflow=self.workflow,
        )

        return ImageOutput(
            image=ImageField(image_name=image_dto.image_name),
            width=image_dto.width,
            height=image_dto.height,
        )


@invocation("img_lerp", title="Lerp Image", tags=["image", "lerp"], category="image")
class ImageLerpInvocation(BaseInvocation):
    """Linear interpolation of all pixels of an image"""

    image: ImageField = InputField(description="The image to lerp")
    min: int = InputField(default=0, ge=0, le=255, description="The minimum output value")
    max: int = InputField(default=255, ge=0, le=255, description="The maximum output value")

    def invoke(self, context: InvocationContext) -> ImageOutput:
        image = context.services.images.get_pil_image(self.image.image_name)

        image_arr = numpy.asarray(image, dtype=numpy.float32) / 255
        image_arr = image_arr * (self.max - self.min) + self.min

        lerp_image = Image.fromarray(numpy.uint8(image_arr))

        image_dto = context.services.images.create(
            image=lerp_image,
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


@invocation("img_ilerp", title="Inverse Lerp Image", tags=["image", "ilerp"], category="image")
class ImageInverseLerpInvocation(BaseInvocation):
    """Inverse linear interpolation of all pixels of an image"""

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
            workflow=self.workflow,
        )

        return ImageOutput(
            image=ImageField(image_name=image_dto.image_name),
            width=image_dto.width,
            height=image_dto.height,
        )


@invocation("img_nsfw", title="Blur NSFW Image", tags=["image", "nsfw"], category="image")
class ImageNSFWBlurInvocation(BaseInvocation):
    """Add blur to NSFW-flagged images"""

    image: ImageField = InputField(description="The image to check")
    metadata: Optional[CoreMetadata] = InputField(
        default=None, description=FieldDescriptions.core_metadata, ui_hidden=True
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
            workflow=self.workflow,
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


@invocation("img_watermark", title="Add Invisible Watermark", tags=["image", "watermark"], category="image")
class ImageWatermarkInvocation(BaseInvocation):
    """Add an invisible watermark to an image"""

    image: ImageField = InputField(description="The image to check")
    text: str = InputField(default="InvokeAI", description="Watermark text")
    metadata: Optional[CoreMetadata] = InputField(
        default=None, description=FieldDescriptions.core_metadata, ui_hidden=True
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
            workflow=self.workflow,
        )

        return ImageOutput(
            image=ImageField(image_name=image_dto.image_name),
            width=image_dto.width,
            height=image_dto.height,
        )


@invocation("mask_edge", title="Mask Edge", tags=["image", "mask", "inpaint"], category="image")
class MaskEdgeInvocation(BaseInvocation):
    """Applies an edge mask to an image"""

    image: ImageField = InputField(description="The image to apply the mask to")
    edge_size: int = InputField(description="The size of the edge")
    edge_blur: int = InputField(description="The amount of blur on the edge")
    low_threshold: int = InputField(description="First threshold for the hysteresis procedure in Canny edge detection")
    high_threshold: int = InputField(
        description="Second threshold for the hysteresis procedure in Canny edge detection"
    )

    def invoke(self, context: InvocationContext) -> ImageOutput:
        mask = context.services.images.get_pil_image(self.image.image_name)

        npimg = numpy.asarray(mask, dtype=numpy.uint8)
        npgradient = numpy.uint8(255 * (1.0 - numpy.floor(numpy.abs(0.5 - numpy.float32(npimg) / 255.0) * 2.0)))
        npedge = cv2.Canny(npimg, threshold1=self.low_threshold, threshold2=self.high_threshold)
        npmask = npgradient + npedge
        npmask = cv2.dilate(npmask, numpy.ones((3, 3), numpy.uint8), iterations=int(self.edge_size / 2))

        new_mask = Image.fromarray(npmask)

        if self.edge_blur > 0:
            new_mask = new_mask.filter(ImageFilter.BoxBlur(self.edge_blur))

        new_mask = ImageOps.invert(new_mask)

        image_dto = context.services.images.create(
            image=new_mask,
            image_origin=ResourceOrigin.INTERNAL,
            image_category=ImageCategory.MASK,
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


@invocation("mask_combine", title="Combine Masks", tags=["image", "mask", "multiply"], category="image")
class MaskCombineInvocation(BaseInvocation):
    """Combine two masks together by multiplying them using `PIL.ImageChops.multiply()`."""

    mask1: ImageField = InputField(description="The first mask to combine")
    mask2: ImageField = InputField(description="The second image to combine")

    def invoke(self, context: InvocationContext) -> ImageOutput:
        mask1 = context.services.images.get_pil_image(self.mask1.image_name).convert("L")
        mask2 = context.services.images.get_pil_image(self.mask2.image_name).convert("L")

        combined_mask = ImageChops.multiply(mask1, mask2)

        image_dto = context.services.images.create(
            image=combined_mask,
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


@invocation("color_correct", title="Color Correct", tags=["image", "color"], category="image")
class ColorCorrectInvocation(BaseInvocation):
    """
    Shifts the colors of a target image to match the reference image, optionally
    using a mask to only color-correct certain regions of the target image.
    """

    image: ImageField = InputField(description="The image to color-correct")
    reference: ImageField = InputField(description="Reference image for color-correction")
    mask: Optional[ImageField] = InputField(default=None, description="Mask to use when applying color-correction")
    mask_blur_radius: float = InputField(default=8, description="Mask blur radius")

    def invoke(self, context: InvocationContext) -> ImageOutput:
        pil_init_mask = None
        if self.mask is not None:
            pil_init_mask = context.services.images.get_pil_image(self.mask.image_name).convert("L")

        init_image = context.services.images.get_pil_image(self.reference.image_name)

        result = context.services.images.get_pil_image(self.image.image_name).convert("RGBA")

        # if init_image is None or init_mask is None:
        #    return result

        # Get the original alpha channel of the mask if there is one.
        # Otherwise it is some other black/white image format ('1', 'L' or 'RGB')
        # pil_init_mask = (
        #    init_mask.getchannel("A")
        #    if init_mask.mode == "RGBA"
        #    else init_mask.convert("L")
        # )
        pil_init_image = init_image.convert("RGBA")  # Add an alpha channel if one doesn't exist

        # Build an image with only visible pixels from source to use as reference for color-matching.
        init_rgb_pixels = numpy.asarray(init_image.convert("RGB"), dtype=numpy.uint8)
        init_a_pixels = numpy.asarray(pil_init_image.getchannel("A"), dtype=numpy.uint8)
        init_mask_pixels = numpy.asarray(pil_init_mask, dtype=numpy.uint8)

        # Get numpy version of result
        np_image = numpy.asarray(result.convert("RGB"), dtype=numpy.uint8)

        # Mask and calculate mean and standard deviation
        mask_pixels = init_a_pixels * init_mask_pixels > 0
        np_init_rgb_pixels_masked = init_rgb_pixels[mask_pixels, :]
        np_image_masked = np_image[mask_pixels, :]

        if np_init_rgb_pixels_masked.size > 0:
            init_means = np_init_rgb_pixels_masked.mean(axis=0)
            init_std = np_init_rgb_pixels_masked.std(axis=0)
            gen_means = np_image_masked.mean(axis=0)
            gen_std = np_image_masked.std(axis=0)

            # Color correct
            np_matched_result = np_image.copy()
            np_matched_result[:, :, :] = (
                (
                    (
                        (np_matched_result[:, :, :].astype(numpy.float32) - gen_means[None, None, :])
                        / gen_std[None, None, :]
                    )
                    * init_std[None, None, :]
                    + init_means[None, None, :]
                )
                .clip(0, 255)
                .astype(numpy.uint8)
            )
            matched_result = Image.fromarray(np_matched_result, mode="RGB")
        else:
            matched_result = Image.fromarray(np_image, mode="RGB")

        # Blur the mask out (into init image) by specified amount
        if self.mask_blur_radius > 0:
            nm = numpy.asarray(pil_init_mask, dtype=numpy.uint8)
            nmd = cv2.erode(
                nm,
                kernel=numpy.ones((3, 3), dtype=numpy.uint8),
                iterations=int(self.mask_blur_radius / 2),
            )
            pmd = Image.fromarray(nmd, mode="L")
            blurred_init_mask = pmd.filter(ImageFilter.BoxBlur(self.mask_blur_radius))
        else:
            blurred_init_mask = pil_init_mask

        multiplied_blurred_init_mask = ImageChops.multiply(blurred_init_mask, result.split()[-1])

        # Paste original on color-corrected generation (using blurred mask)
        matched_result.paste(init_image, (0, 0), mask=multiplied_blurred_init_mask)

        image_dto = context.services.images.create(
            image=matched_result,
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


@invocation("img_hue_adjust", title="Adjust Image Hue", tags=["image", "hue"], category="image")
class ImageHueAdjustmentInvocation(BaseInvocation):
    """Adjusts the Hue of an image."""

    image: ImageField = InputField(description="The image to adjust")
    hue: int = InputField(default=0, description="The degrees by which to rotate the hue, 0-360")

    def invoke(self, context: InvocationContext) -> ImageOutput:
        pil_image = context.services.images.get_pil_image(self.image.image_name)

        # Convert image to HSV color space
        hsv_image = numpy.array(pil_image.convert("HSV"))

        # Convert hue from 0..360 to 0..256
        hue = int(256 * ((self.hue % 360) / 360))

        # Increment each hue and wrap around at 255
        hsv_image[:, :, 0] = (hsv_image[:, :, 0] + hue) % 256

        # Convert back to PIL format and to original color mode
        pil_image = Image.fromarray(hsv_image, mode="HSV").convert("RGBA")

        image_dto = context.services.images.create(
            image=pil_image,
            image_origin=ResourceOrigin.INTERNAL,
            image_category=ImageCategory.GENERAL,
            node_id=self.id,
            is_intermediate=self.is_intermediate,
            session_id=context.graph_execution_state_id,
            workflow=self.workflow,
        )

        return ImageOutput(
            image=ImageField(
                image_name=image_dto.image_name,
            ),
            width=image_dto.width,
            height=image_dto.height,
        )


@invocation(
    "img_luminosity_adjust",
    title="Adjust Image Luminosity",
    tags=["image", "luminosity", "hsl"],
    category="image",
)
class ImageLuminosityAdjustmentInvocation(BaseInvocation):
    """Adjusts the Luminosity (Value) of an image."""

    image: ImageField = InputField(description="The image to adjust")
    luminosity: float = InputField(
        default=1.0, ge=0, le=1, description="The factor by which to adjust the luminosity (value)"
    )

    def invoke(self, context: InvocationContext) -> ImageOutput:
        pil_image = context.services.images.get_pil_image(self.image.image_name)

        # Convert PIL image to OpenCV format (numpy array), note color channel
        # ordering is changed from RGB to BGR
        image = numpy.array(pil_image.convert("RGB"))[:, :, ::-1]

        # Convert image to HSV color space
        hsv_image = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

        # Adjust the luminosity (value)
        hsv_image[:, :, 2] = numpy.clip(hsv_image[:, :, 2] * self.luminosity, 0, 255)

        # Convert image back to BGR color space
        image = cv2.cvtColor(hsv_image, cv2.COLOR_HSV2BGR)

        # Convert back to PIL format and to original color mode
        pil_image = Image.fromarray(image[:, :, ::-1], "RGB").convert("RGBA")

        image_dto = context.services.images.create(
            image=pil_image,
            image_origin=ResourceOrigin.INTERNAL,
            image_category=ImageCategory.GENERAL,
            node_id=self.id,
            is_intermediate=self.is_intermediate,
            session_id=context.graph_execution_state_id,
            workflow=self.workflow,
        )

        return ImageOutput(
            image=ImageField(
                image_name=image_dto.image_name,
            ),
            width=image_dto.width,
            height=image_dto.height,
        )


@invocation(
    "img_saturation_adjust",
    title="Adjust Image Saturation",
    tags=["image", "saturation", "hsl"],
    category="image",
)
class ImageSaturationAdjustmentInvocation(BaseInvocation):
    """Adjusts the Saturation of an image."""

    image: ImageField = InputField(description="The image to adjust")
    saturation: float = InputField(default=1.0, ge=0, le=1, description="The factor by which to adjust the saturation")

    def invoke(self, context: InvocationContext) -> ImageOutput:
        pil_image = context.services.images.get_pil_image(self.image.image_name)

        # Convert PIL image to OpenCV format (numpy array), note color channel
        # ordering is changed from RGB to BGR
        image = numpy.array(pil_image.convert("RGB"))[:, :, ::-1]

        # Convert image to HSV color space
        hsv_image = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

        # Adjust the saturation
        hsv_image[:, :, 1] = numpy.clip(hsv_image[:, :, 1] * self.saturation, 0, 255)

        # Convert image back to BGR color space
        image = cv2.cvtColor(hsv_image, cv2.COLOR_HSV2BGR)

        # Convert back to PIL format and to original color mode
        pil_image = Image.fromarray(image[:, :, ::-1], "RGB").convert("RGBA")

        image_dto = context.services.images.create(
            image=pil_image,
            image_origin=ResourceOrigin.INTERNAL,
            image_category=ImageCategory.GENERAL,
            node_id=self.id,
            is_intermediate=self.is_intermediate,
            session_id=context.graph_execution_state_id,
            workflow=self.workflow,
        )

        return ImageOutput(
            image=ImageField(
                image_name=image_dto.image_name,
            ),
            width=image_dto.width,
            height=image_dto.height,
        )
