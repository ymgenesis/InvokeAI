# Copyright (c) 2023 Kyle Schouviller (https://github.com/kyle0654)

from typing import Optional, Tuple

import torch
from pydantic import BaseModel, Field

from .baseinvocation import (
    BaseInvocation,
    BaseInvocationOutput,
    FieldDescriptions,
    Input,
    InputField,
    InvocationContext,
    OutputField,
    UIComponent,
    invocation,
    invocation_output,
)

"""
Primitives: Boolean, Integer, Float, String, Image, Latents, Conditioning, Color
- primitive nodes
- primitive outputs
- primitive collection outputs
"""

# region Boolean


@invocation_output("boolean_output")
class BooleanOutput(BaseInvocationOutput):
    """Base class for nodes that output a single boolean"""

    value: bool = OutputField(description="The output boolean")


@invocation_output("boolean_collection_output")
class BooleanCollectionOutput(BaseInvocationOutput):
    """Base class for nodes that output a collection of booleans"""

    collection: list[bool] = OutputField(
        description="The output boolean collection",
    )


@invocation(
    "boolean", title="Boolean Primitive", tags=["primitives", "boolean"], category="primitives", version="1.0.0"
)
class BooleanInvocation(BaseInvocation):
    """A boolean primitive value"""

    value: bool = InputField(default=False, description="The boolean value")

    def invoke(self, context: InvocationContext) -> BooleanOutput:
        return BooleanOutput(value=self.value)


@invocation(
    "boolean_collection",
    title="Boolean Collection Primitive",
    tags=["primitives", "boolean", "collection"],
    category="primitives",
    version="1.0.0",
)
class BooleanCollectionInvocation(BaseInvocation):
    """A collection of boolean primitive values"""

    collection: list[bool] = InputField(default_factory=list, description="The collection of boolean values")

    def invoke(self, context: InvocationContext) -> BooleanCollectionOutput:
        return BooleanCollectionOutput(collection=self.collection)


# endregion

# region Integer


@invocation_output("integer_output")
class IntegerOutput(BaseInvocationOutput):
    """Base class for nodes that output a single integer"""

    value: int = OutputField(description="The output integer")


@invocation_output("integer_collection_output")
class IntegerCollectionOutput(BaseInvocationOutput):
    """Base class for nodes that output a collection of integers"""

    collection: list[int] = OutputField(
        description="The int collection",
    )


@invocation(
    "integer", title="Integer Primitive", tags=["primitives", "integer"], category="primitives", version="1.0.0"
)
class IntegerInvocation(BaseInvocation):
    """An integer primitive value"""

    value: int = InputField(default=0, description="The integer value")

    def invoke(self, context: InvocationContext) -> IntegerOutput:
        return IntegerOutput(value=self.value)


@invocation(
    "integer_collection",
    title="Integer Collection Primitive",
    tags=["primitives", "integer", "collection"],
    category="primitives",
    version="1.0.0",
)
class IntegerCollectionInvocation(BaseInvocation):
    """A collection of integer primitive values"""

    collection: list[int] = InputField(default_factory=list, description="The collection of integer values")

    def invoke(self, context: InvocationContext) -> IntegerCollectionOutput:
        return IntegerCollectionOutput(collection=self.collection)


# endregion

# region Float


@invocation_output("float_output")
class FloatOutput(BaseInvocationOutput):
    """Base class for nodes that output a single float"""

    value: float = OutputField(description="The output float")


@invocation_output("float_collection_output")
class FloatCollectionOutput(BaseInvocationOutput):
    """Base class for nodes that output a collection of floats"""

    collection: list[float] = OutputField(
        description="The float collection",
    )


@invocation("float", title="Float Primitive", tags=["primitives", "float"], category="primitives", version="1.0.0")
class FloatInvocation(BaseInvocation):
    """A float primitive value"""

    value: float = InputField(default=0.0, description="The float value")

    def invoke(self, context: InvocationContext) -> FloatOutput:
        return FloatOutput(value=self.value)


@invocation(
    "float_collection",
    title="Float Collection Primitive",
    tags=["primitives", "float", "collection"],
    category="primitives",
    version="1.0.0",
)
class FloatCollectionInvocation(BaseInvocation):
    """A collection of float primitive values"""

    collection: list[float] = InputField(default_factory=list, description="The collection of float values")

    def invoke(self, context: InvocationContext) -> FloatCollectionOutput:
        return FloatCollectionOutput(collection=self.collection)


# endregion

# region String


@invocation_output("string_output")
class StringOutput(BaseInvocationOutput):
    """Base class for nodes that output a single string"""

    value: str = OutputField(description="The output string")


@invocation_output("string_collection_output")
class StringCollectionOutput(BaseInvocationOutput):
    """Base class for nodes that output a collection of strings"""

    collection: list[str] = OutputField(
        description="The output strings",
    )


@invocation("string", title="String Primitive", tags=["primitives", "string"], category="primitives", version="1.0.0")
class StringInvocation(BaseInvocation):
    """A string primitive value"""

    value: str = InputField(default="", description="The string value", ui_component=UIComponent.Textarea)

    def invoke(self, context: InvocationContext) -> StringOutput:
        return StringOutput(value=self.value)


@invocation(
    "string_collection",
    title="String Collection Primitive",
    tags=["primitives", "string", "collection"],
    category="primitives",
    version="1.0.0",
)
class StringCollectionInvocation(BaseInvocation):
    """A collection of string primitive values"""

    collection: list[str] = InputField(default_factory=list, description="The collection of string values")

    def invoke(self, context: InvocationContext) -> StringCollectionOutput:
        return StringCollectionOutput(collection=self.collection)


# endregion

# region Image


class ImageField(BaseModel):
    """An image primitive field"""

    image_name: str = Field(description="The name of the image")


class BoardField(BaseModel):
    """A board primitive field"""

    board_id: str = Field(description="The id of the board")


@invocation_output("image_output")
class ImageOutput(BaseInvocationOutput):
    """Base class for nodes that output a single image"""

    image: ImageField = OutputField(description="The output image")
    width: int = OutputField(description="The width of the image in pixels")
    height: int = OutputField(description="The height of the image in pixels")


@invocation_output("image_collection_output")
class ImageCollectionOutput(BaseInvocationOutput):
    """Base class for nodes that output a collection of images"""

    collection: list[ImageField] = OutputField(
        description="The output images",
    )


@invocation("image", title="Image Primitive", tags=["primitives", "image"], category="primitives", version="1.0.0")
class ImageInvocation(BaseInvocation):
    """An image primitive value"""

    image: ImageField = InputField(description="The image to load")

    def invoke(self, context: InvocationContext) -> ImageOutput:
        image = context.services.images.get_pil_image(self.image.image_name)

        return ImageOutput(
            image=ImageField(image_name=self.image.image_name),
            width=image.width,
            height=image.height,
        )


@invocation(
    "image_collection",
    title="Image Collection Primitive",
    tags=["primitives", "image", "collection"],
    category="primitives",
    version="1.0.0",
)
class ImageCollectionInvocation(BaseInvocation):
    """A collection of image primitive values"""

    collection: list[ImageField] = InputField(description="The collection of image values")

    def invoke(self, context: InvocationContext) -> ImageCollectionOutput:
        return ImageCollectionOutput(collection=self.collection)


# endregion

# region DenoiseMask


class DenoiseMaskField(BaseModel):
    """An inpaint mask field"""

    mask_name: str = Field(description="The name of the mask image")
    masked_latents_name: Optional[str] = Field(description="The name of the masked image latents")


@invocation_output("denoise_mask_output")
class DenoiseMaskOutput(BaseInvocationOutput):
    """Base class for nodes that output a single image"""

    denoise_mask: DenoiseMaskField = OutputField(description="Mask for denoise model run")


# endregion

# region Latents


class LatentsField(BaseModel):
    """A latents tensor primitive field"""

    latents_name: str = Field(description="The name of the latents")
    seed: Optional[int] = Field(default=None, description="Seed used to generate this latents")


@invocation_output("latents_output")
class LatentsOutput(BaseInvocationOutput):
    """Base class for nodes that output a single latents tensor"""

    latents: LatentsField = OutputField(
        description=FieldDescriptions.latents,
    )
    width: int = OutputField(description=FieldDescriptions.width)
    height: int = OutputField(description=FieldDescriptions.height)


@invocation_output("latents_collection_output")
class LatentsCollectionOutput(BaseInvocationOutput):
    """Base class for nodes that output a collection of latents tensors"""

    collection: list[LatentsField] = OutputField(
        description=FieldDescriptions.latents,
    )


@invocation(
    "latents", title="Latents Primitive", tags=["primitives", "latents"], category="primitives", version="1.0.0"
)
class LatentsInvocation(BaseInvocation):
    """A latents tensor primitive value"""

    latents: LatentsField = InputField(description="The latents tensor", input=Input.Connection)

    def invoke(self, context: InvocationContext) -> LatentsOutput:
        latents = context.services.latents.get(self.latents.latents_name)

        return build_latents_output(self.latents.latents_name, latents)


@invocation(
    "latents_collection",
    title="Latents Collection Primitive",
    tags=["primitives", "latents", "collection"],
    category="primitives",
    version="1.0.0",
)
class LatentsCollectionInvocation(BaseInvocation):
    """A collection of latents tensor primitive values"""

    collection: list[LatentsField] = InputField(
        description="The collection of latents tensors",
    )

    def invoke(self, context: InvocationContext) -> LatentsCollectionOutput:
        return LatentsCollectionOutput(collection=self.collection)


def build_latents_output(latents_name: str, latents: torch.Tensor, seed: Optional[int] = None):
    return LatentsOutput(
        latents=LatentsField(latents_name=latents_name, seed=seed),
        width=latents.size()[3] * 8,
        height=latents.size()[2] * 8,
    )


# endregion

# region Color


class ColorField(BaseModel):
    """A color primitive field"""

    r: int = Field(ge=0, le=255, description="The red component")
    g: int = Field(ge=0, le=255, description="The green component")
    b: int = Field(ge=0, le=255, description="The blue component")
    a: int = Field(ge=0, le=255, description="The alpha component")

    def tuple(self) -> Tuple[int, int, int, int]:
        return (self.r, self.g, self.b, self.a)


@invocation_output("color_output")
class ColorOutput(BaseInvocationOutput):
    """Base class for nodes that output a single color"""

    color: ColorField = OutputField(description="The output color")


@invocation_output("color_collection_output")
class ColorCollectionOutput(BaseInvocationOutput):
    """Base class for nodes that output a collection of colors"""

    collection: list[ColorField] = OutputField(
        description="The output colors",
    )


@invocation("color", title="Color Primitive", tags=["primitives", "color"], category="primitives", version="1.0.0")
class ColorInvocation(BaseInvocation):
    """A color primitive value"""

    color: ColorField = InputField(default=ColorField(r=0, g=0, b=0, a=255), description="The color value")

    def invoke(self, context: InvocationContext) -> ColorOutput:
        return ColorOutput(color=self.color)


# endregion

# region Conditioning


class ConditioningField(BaseModel):
    """A conditioning tensor primitive value"""

    conditioning_name: str = Field(description="The name of conditioning tensor")


@invocation_output("conditioning_output")
class ConditioningOutput(BaseInvocationOutput):
    """Base class for nodes that output a single conditioning tensor"""

    conditioning: ConditioningField = OutputField(description=FieldDescriptions.cond)


@invocation_output("conditioning_collection_output")
class ConditioningCollectionOutput(BaseInvocationOutput):
    """Base class for nodes that output a collection of conditioning tensors"""

    collection: list[ConditioningField] = OutputField(
        description="The output conditioning tensors",
    )


@invocation(
    "conditioning",
    title="Conditioning Primitive",
    tags=["primitives", "conditioning"],
    category="primitives",
    version="1.0.0",
)
class ConditioningInvocation(BaseInvocation):
    """A conditioning tensor primitive value"""

    conditioning: ConditioningField = InputField(description=FieldDescriptions.cond, input=Input.Connection)

    def invoke(self, context: InvocationContext) -> ConditioningOutput:
        return ConditioningOutput(conditioning=self.conditioning)


@invocation(
    "conditioning_collection",
    title="Conditioning Collection Primitive",
    tags=["primitives", "conditioning", "collection"],
    category="primitives",
    version="1.0.0",
)
class ConditioningCollectionInvocation(BaseInvocation):
    """A collection of conditioning tensor primitive values"""

    collection: list[ConditioningField] = InputField(
        default_factory=list,
        description="The collection of conditioning tensors",
    )

    def invoke(self, context: InvocationContext) -> ConditioningCollectionOutput:
        return ConditioningCollectionOutput(collection=self.collection)


# endregion
