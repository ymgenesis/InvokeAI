# Copyright (c) 2022 Kyle Schouviller (https://github.com/kyle0654)

from __future__ import annotations

from abc import ABC, abstractmethod
from inspect import signature
from typing import TYPE_CHECKING, Literal, Optional, get_args, get_type_hints

from pydantic import BaseConfig, BaseModel, Field

if TYPE_CHECKING:
    from ..services.invocation_services import InvocationServices


class InvocationContext:
    services: InvocationServices
    graph_execution_state_id: str

    def __init__(self, services: InvocationServices, graph_execution_state_id: str):
        self.services = services
        self.graph_execution_state_id = graph_execution_state_id


class BaseInvocationOutput(BaseModel):
    """Base class for all invocation outputs"""

    # All outputs must include a type name like this:
    # type: Literal['your_output_name']

    @classmethod
    def get_all_subclasses_tuple(cls):
        subclasses = []
        toprocess = [cls]
        while len(toprocess) > 0:
            next = toprocess.pop(0)
            next_subclasses = next.__subclasses__()
            subclasses.extend(next_subclasses)
            toprocess.extend(next_subclasses)
        return tuple(subclasses)


class BaseInvocation(ABC, BaseModel):
    """A node to process inputs and produce outputs.
    May use dependency injection in __init__ to receive providers.
    """

    # All invocations must include a type name like this:
    # type: Literal['your_output_name']

    @classmethod
    def get_all_subclasses(cls):
        subclasses = []
        toprocess = [cls]
        while len(toprocess) > 0:
            next = toprocess.pop(0)
            next_subclasses = next.__subclasses__()
            subclasses.extend(next_subclasses)
            toprocess.extend(next_subclasses)
        return subclasses

    @classmethod
    def get_invocations(cls):
        return tuple(BaseInvocation.get_all_subclasses())

    @classmethod
    def get_invocations_map(cls):
        # Get the type strings out of the literals and into a dictionary
        return dict(
            map(
                lambda t: (get_args(get_type_hints(t)["type"])[0], t),
                BaseInvocation.get_all_subclasses(),
            )
        )

    @classmethod
    def get_output_type(cls):
        return signature(cls.invoke).return_annotation

    @abstractmethod
    def invoke(self, context: InvocationContext) -> BaseInvocationOutput:
        """Invoke with provided context and return outputs."""
        pass

    # fmt: off
    id: str = Field(description="The id of this node. Must be unique among all nodes.")
    is_intermediate: bool = Field(default=False, description="Whether or not this node is an intermediate node.")
    # fmt: on


UI_FIELD_INPUT_KIND = Literal["connection", "direct", "any"]

UI_FIELD_INPUT_REQUIREMENT = Literal["none", "required", "optional"]

UI_FIELD_TYPE = Literal[
    "integer",
    "float",
    "boolean",
    "string",
    "enum",
    "image",
    "latents",
    "conditioning",
    "control",
    "main_model",
    "sdxl_main_model",
    "sdxl_refiner_model",
    "onnx_model",
    "vae_model",
    "lora_model",
    "controlnet_model",
    "unet_field",
    "vae_field",
    "lora_field",
    "clip_field",
    "array",
    "color",
    "image_collection",
    "item",
    "any_collection",  # Iterate Nodes only
    "collection_item",  # Iterate Nodes only
]

UI_FIELD_COMPONENT = Literal[
    "none",
    "textarea",
    "slider",
]


class UIInputField(BaseModel):
    """Provides additional node input field configuration to the UI."""

    input_kind: Optional[UI_FIELD_INPUT_KIND] = Field(
        default="any", description="The kind of input accepted by the field ['any']"
    )
    input_requirement: Optional[UI_FIELD_INPUT_REQUIREMENT] = Field(
        default="required", description="The input requirements of the field ['required']"
    )
    field_type: Optional[UI_FIELD_TYPE] = Field(
        default=None, description="The type of the field; overrides the type inferred from pydantic model"
    )
    component: Optional[UI_FIELD_COMPONENT] = Field(default=None, description="The component to use for the field")
    hidden: Optional[bool] = Field(default=False, description="Whether or not to hide the field")


class UINodeConfig(BaseModel):
    """Provides additional node configuration to the UI."""

    fields: dict[str, UIInputField] = Field(default_factory=dict, description="Additional UI configuration for fields")
    tags: list[str] = Field(default_factory=list, description="The tags to display in the UI")
    title: Optional[str] = Field(default=None, description="The display name of the node")


class UIOutputField(BaseModel):
    """Provides additional node output field configuration to the UI."""

    field_type: Optional[UI_FIELD_TYPE] = Field(
        default=None, description="The type of the field; overrides the type inferred from pydantic model"
    )
    hidden: Optional[bool] = Field(default=False, description="Whether or not to hide the field")


class UIOutputConfig(BaseModel):
    """Provides additional node output configuration to the UI."""

    fields: dict[str, UIOutputField] = Field(default_factory=dict, description="Additional UI configuration for fields")
