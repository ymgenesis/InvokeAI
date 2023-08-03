# Copyright (c) 2022 Kyle Schouviller (https://github.com/kyle0654)

from __future__ import annotations

from abc import ABC, abstractmethod
from enum import Enum
from inspect import signature
from typing import TYPE_CHECKING, AbstractSet, Any, Mapping, Optional, Union, get_args, get_type_hints

from pydantic import BaseModel, Field
from pydantic.fields import Undefined
from pydantic.typing import NoArgAnyCallable

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


# class RequiredConnectionException(Exception):
#     """Raised when an field which requires a connection did not receive a value."""

#     def __init__(self, node_id: str, field_name: str):
#         super().__init__(f"Field {field_name} of node {node_id} must set input from connection!")


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

    id: str = Field(description="The id of this node. Must be unique among all nodes.")
    is_intermediate: bool = Field(default=False, description="Whether or not this node is an intermediate node.")


class InputKind(str, Enum):
    Connection = "connection"
    Direct = "direct"
    Any = "any"


class InputRequirement(str, Enum):
    None_ = "none"
    Required = "required"
    Optional = "optional"


class UITypeHint(str, Enum):
    Integer = "integer"
    Float = "float"
    Boolean = "boolean"
    String = "string"
    Enum = "enum"
    Array = "array"
    ImageField = "ImageField"
    LatentsField = "LatentsField"
    ConditioningField = "ConditioningField"
    ControlField = "ControlField"
    MainModelField = "MainModelField"
    SDXLMainModelField = "SDXLMainModelField"
    SDXLRefinerModelField = "SDXLRefinerModelField"
    ONNXModelField = "ONNXModelField"
    VaeModelField = "VaeModelField"
    LoRAModelField = "LoRAModelField"
    ControlNetModelField = "ControlNetModelField"
    UNetField = "UNetField"
    VaeField = "VaeField"
    LoRAField = "LoRAField"
    ClipField = "ClipField"
    ColorField = "ColorField"
    ImageCollection = "ImageCollection"
    IntegerCollection = "IntegerCollection"
    FloatCollection = "FloatCollection"
    StringCollection = "StringCollection"
    BooleanCollection = "BooleanCollection"
    Collection = "Collection"
    CollectionItem = "CollectionItem"
    Seed = "Seed"
    FilePath = "FilePath"


class UIComponent(str, Enum):
    None_ = "none"
    TextArea = "textarea"
    Slider = "slider"


class InputFieldExtra(BaseModel):
    input_kind: InputKind = Field(default=InputKind.Any)
    input_requirement: InputRequirement = Field(default=InputRequirement.Required)
    ui_hidden: bool = Field(default=False)
    ui_type_hint: Optional[UITypeHint] = Field(default=None)  # infer from type
    ui_component: Optional[UIComponent] = Field(default=None)  # infer from type

    class Config:
        schema_extra = {
            "required": [
                "input_kind",
                "input_requirement",
                "ui_hidden",
            ]
        }


class OutputFieldExtra(BaseModel):
    ui_hidden: bool = Field(default=False)
    ui_type_hint: Optional[UITypeHint] = Field(default=None)  # infer from type

    class Config:
        schema_extra = {
            "required": [
                "ui_hidden",
            ]
        }


class UINodeConfig(BaseModel):
    """Provides additional node configuration to the UI."""

    tags: list[str] = Field(default_factory=list, description="The tags to display in the UI")
    title: Optional[str] = Field(default=None, description="The display name of the node")


def InputField(
    *args: Any,
    default: Any = Undefined,
    default_factory: Optional[NoArgAnyCallable] = None,
    alias: Optional[str] = None,
    title: Optional[str] = None,
    description: Optional[str] = None,
    exclude: Optional[Union[AbstractSet[Union[int, str]], Mapping[Union[int, str], Any], Any]] = None,
    include: Optional[Union[AbstractSet[Union[int, str]], Mapping[Union[int, str], Any], Any]] = None,
    const: Optional[bool] = None,
    gt: Optional[float] = None,
    ge: Optional[float] = None,
    lt: Optional[float] = None,
    le: Optional[float] = None,
    multiple_of: Optional[float] = None,
    allow_inf_nan: Optional[bool] = None,
    max_digits: Optional[int] = None,
    decimal_places: Optional[int] = None,
    min_items: Optional[int] = None,
    max_items: Optional[int] = None,
    unique_items: Optional[bool] = None,
    min_length: Optional[int] = None,
    max_length: Optional[int] = None,
    allow_mutation: bool = True,
    regex: Optional[str] = None,
    discriminator: Optional[str] = None,
    repr: bool = True,
    input_kind: InputKind = InputKind.Any,
    input_requirement: InputRequirement = InputRequirement.Required,
    ui_type_hint: Optional[UITypeHint] = None,  # infer from type
    ui_component: Optional[UIComponent] = None,  # infer from type
    ui_hidden: bool = False,
    **kwargs: Any,
) -> Any:
    return Field(
        *args,
        default=default,
        default_factory=default_factory,
        alias=alias,
        title=title,
        description=description,
        exclude=exclude,
        include=include,
        const=const,
        gt=gt,
        ge=ge,
        lt=lt,
        le=le,
        multiple_of=multiple_of,
        allow_inf_nan=allow_inf_nan,
        max_digits=max_digits,
        decimal_places=decimal_places,
        min_items=min_items,
        max_items=max_items,
        unique_items=unique_items,
        min_length=min_length,
        max_length=max_length,
        allow_mutation=allow_mutation,
        regex=regex,
        discriminator=discriminator,
        repr=repr,
        input_kind=input_kind,
        input_requirement=input_requirement,
        ui_type_hint=ui_type_hint,
        ui_component=ui_component,
        ui_hidden=ui_hidden,
        **kwargs,
    )


def OutputField(
    *args: Any,
    default: Any = Undefined,
    default_factory: Optional[NoArgAnyCallable] = None,
    alias: Optional[str] = None,
    title: Optional[str] = None,
    description: Optional[str] = None,
    exclude: Optional[Union[AbstractSet[Union[int, str]], Mapping[Union[int, str], Any], Any]] = None,
    include: Optional[Union[AbstractSet[Union[int, str]], Mapping[Union[int, str], Any], Any]] = None,
    const: Optional[bool] = None,
    gt: Optional[float] = None,
    ge: Optional[float] = None,
    lt: Optional[float] = None,
    le: Optional[float] = None,
    multiple_of: Optional[float] = None,
    allow_inf_nan: Optional[bool] = None,
    max_digits: Optional[int] = None,
    decimal_places: Optional[int] = None,
    min_items: Optional[int] = None,
    max_items: Optional[int] = None,
    unique_items: Optional[bool] = None,
    min_length: Optional[int] = None,
    max_length: Optional[int] = None,
    allow_mutation: bool = True,
    regex: Optional[str] = None,
    discriminator: Optional[str] = None,
    repr: bool = True,
    ui_type_hint: Optional[UITypeHint] = None,  # infer from type
    ui_hidden: bool = False,
    **kwargs: Any,
) -> Any:
    return Field(
        *args,
        default=default,
        default_factory=default_factory,
        alias=alias,
        title=title,
        description=description,
        exclude=exclude,
        include=include,
        const=const,
        gt=gt,
        ge=ge,
        lt=lt,
        le=le,
        multiple_of=multiple_of,
        allow_inf_nan=allow_inf_nan,
        max_digits=max_digits,
        decimal_places=decimal_places,
        min_items=min_items,
        max_items=max_items,
        unique_items=unique_items,
        min_length=min_length,
        max_length=max_length,
        allow_mutation=allow_mutation,
        regex=regex,
        discriminator=discriminator,
        repr=repr,
        ui_type_hint=ui_type_hint,
        ui_hidden=ui_hidden,
        **kwargs,
    )


def node_title(title):
    def wrapper(cls):
        if cls.Config is BaseInvocation.Config:
            cls.Config = type(cls.__qualname__ + ".Config", (BaseInvocation.Config,), dict())
        if cls.Config.schema_extra is BaseInvocation.Config.schema_extra:
            cls.Config.schema_extra = dict(BaseInvocation.Config.schema_extra)
        if "ui" not in cls.Config.schema_extra:
            cls.Config.schema_extra["ui"] = dict()
        cls.Config.schema_extra["ui"]["title"] = title
        return cls

    return wrapper


# def node_title(title: str):
#     def wrapper(cls):
#         if "ui" not in cls.Config.schema_extra:
#             cls.Config.schema_extra["ui"] = dict()
#         cls.Config.schema_extra["ui"]["title"] = title
#         return cls

#     return wrapper


def node_tags(*args: str):
    def wrapper(cls):
        if "ui" not in cls.Config.schema_extra:
            cls.Config.schema_extra["ui"] = dict()
        cls.Config.schema_extra["ui"]["tags"] = list(args)
        return cls

    return wrapper
