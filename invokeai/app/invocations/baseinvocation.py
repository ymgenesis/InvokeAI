# Copyright (c) 2022 Kyle Schouviller (https://github.com/kyle0654)

from __future__ import annotations

from abc import ABC, abstractmethod
import copy
from enum import Enum
from inspect import signature
from typing import (
    TYPE_CHECKING,
    AbstractSet,
    Any,
    Mapping,
    Optional,
    Type,
    TypeVar,
    Union,
    cast,
    get_args,
    get_origin,
    get_type_hints,
)

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


class RequiredConnectionException(Exception):
    """Raised when an field which requires a connection did not receive a value."""

    def __init__(self, node_id: str, field_name: str):
        super().__init__(f"Node {node_id} missing connections for field {field_name}")


class MissingInputException(Exception):
    """Raised when an field which requires some input, but did not receive a value."""

    def __init__(self, node_id: str, field_name: str):
        super().__init__(f"Node {node_id} missing value or connection for field {field_name}")


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

    class Config:
        @staticmethod
        def schema_extra(schema: dict[str, Any], model_class: Type[BaseModel]):
            uiconfig = getattr(model_class, "UIConfig", None)
            if uiconfig and hasattr(uiconfig, "title"):
                schema["title"] = uiconfig.title
            if uiconfig and hasattr(uiconfig, "tags"):
                schema["tags"] = uiconfig.tags

    @abstractmethod
    def invoke(self, context: InvocationContext) -> BaseInvocationOutput:
        """Invoke with provided context and return outputs."""
        pass

    def __init__(self, **data):
        # nodes may have required fields, that can accept input from connections
        # on instantiation of the model, we need to exclude these from validation
        restore = dict()
        try:
            field_names = list(self.__fields__.keys())
            for field_name in field_names:
                # if the field is required and may get its value from a connection, exclude it from validation
                field = self.__fields__[field_name]
                input_kind = field.field_info.extra.get("input_kind", None)
                if input_kind in [InputKind.Connection, InputKind.Any] and field.required:
                    if field_name not in data:
                        restore[field_name] = self.__fields__.pop(field_name)
            # instantiate the node, which will validate the data
            super().__init__(**data)
        finally:
            # restore the removed fields
            for field_name, field in restore.items():
                self.__fields__[field_name] = field

    def __invoke__(self, context: InvocationContext) -> BaseInvocationOutput:
        for field_name, field in self.__fields__.items():
            input_kind = field.field_info.extra.get("input_kind", None)
            if field.required and not hasattr(self, field_name):
                if input_kind == InputKind.Connection:
                    raise RequiredConnectionException(self.__fields__["type"].default, field_name)
                elif input_kind == InputKind.Any:
                    raise MissingInputException(self.__fields__["type"].default, field_name)
        return self.invoke(context)

    id: str = Field(description="The id of this node. Must be unique among all nodes.")
    is_intermediate: bool = Field(default=False, description="Whether or not this node is an intermediate node.")


class InputKind(str, Enum):
    Connection = "connection"
    Direct = "direct"
    Any = "any"


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
    input_kind: InputKind
    ui_hidden: bool
    ui_type_hint: Optional[UITypeHint]
    ui_component: Optional[UIComponent]


class OutputFieldExtra(BaseModel):
    ui_hidden: bool
    ui_type_hint: Optional[UITypeHint]


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
    ui_type_hint: Optional[UITypeHint] = None,  # if not provided, infer from type
    ui_component: Optional[UIComponent] = None,  # if not provided, infer from type
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


class UIConfig(BaseModel):
    """Provides additional node configuration to the UI."""

    tags: Optional[list[str]] = Field(default_factory=None, description="The tags to display in the UI")
    title: Optional[str] = Field(default=None, description="The display name of the node")


def node_title(title):
    """Adds a title to the node."""

    def wrapper(cls):
        if not hasattr(cls, "UIConfig"):
            cls.UIConfig = type(cls.__qualname__ + ".UIConfig", (UIConfig,), dict())
        cls.UIConfig.title = title
        return cls

    return wrapper


def node_tags(*tags: str):
    """Adds tags to the node."""

    def wrapper(cls):
        if not hasattr(cls, "UIConfig"):
            cls.UIConfig = type(cls.__qualname__ + ".UIConfig", (UIConfig,), dict())
        cls.UIConfig.tags = list(tags)
        return cls

    return wrapper
