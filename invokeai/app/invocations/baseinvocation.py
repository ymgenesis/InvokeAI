# Copyright (c) 2022 Kyle Schouviller (https://github.com/kyle0654)

from __future__ import annotations

from abc import ABC, abstractmethod
from enum import Enum
from inspect import signature
from typing import TYPE_CHECKING, AbstractSet, Any, Mapping, Optional, Type, Union, get_args, get_type_hints

from pydantic import BaseModel, Field
from pydantic.fields import Undefined
from pydantic.typing import NoArgAnyCallable

if TYPE_CHECKING:
    from ..services.invocation_services import InvocationServices


class Input(str, Enum):
    """
    The type of input a field accepts.
    - `Input.Direct`: The field must have its value provided directly, when the invocation and field \
      are instantiated.
    - `Input.Connection`: The field must have its value provided by a connection.
    - `Input.Any`: The field may have its value provided either directly or by a connection.
    """

    Connection = "connection"
    Direct = "direct"
    Any = "any"


class UITypeHint(str, Enum):
    """
    Type hints for the UI.
    If a field should be provided a data type that does not exactly match the python type of the field, \
    use this to provide the type that should be used instead.
    """

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
    """
    The type of UI component to use for a field, used to override the default components, which are \
    inferred from the field type.
    """

    None_ = "none"
    Textarea = "textarea"
    Slider = "slider"


class _InputField(BaseModel):
    """
    *DO NOT USE*
    Helper class to generate Typescript types for the client.
    """

    input: Input
    ui_hidden: bool
    ui_type_hint: Optional[UITypeHint]
    ui_component: Optional[UIComponent]


class _OutputField(BaseModel):
    """
    *DO NOT USE*
    Helper class to generate Typescript types for the client.
    """

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
    input: Input = Input.Any,
    ui_type_hint: Optional[UITypeHint] = None,
    ui_component: Optional[UIComponent] = None,
    ui_hidden: bool = False,
    **kwargs: Any,
) -> Any:
    """
    Creates an input field for an invocation.

    This is a wrapper for Pydantic's [Field](https://docs.pydantic.dev/1.10/usage/schema/#field-customization) \
    that adds a few extra parameters to support graph execution and the node editor UI.

    :param Input input: [Input.Any] The kind of input this field requires. \
      `Input.Direct` means a value must be provided on instantiation. \
      `Input.Connection` means the value must be provided by a connection. \
      `Input.Any` means either will do.

    :param UITypeHint ui_type_hint: [None] Optionally provides an extra type hint for the UI. \
      In some situations, the field's type is not enough to infer the correct UI type. \
      For example, an `integer` field may be a seed, which is a constrained version integer, \
      which does not accept *any* integer. For this case, you could use `UITypeHint.Seed` to \
      indicate that the field is a seed.
      
    :param UIComponent ui_component: [None] Optionally specifies a specific component to use in the UI. \
      The UI will always render a suitable component, but sometimes you want something different than the default. \
      For example, a `string` field will default to a single-line input, but you may want a multi-line textarea instead. \
      For this case, you could provide `UIComponent.Textarea`.

    : param bool ui_hidden: [False] Specifies whether or not this field should be hidden in the UI.
    """
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
        input=input,
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
    ui_type_hint: Optional[UITypeHint] = None,
    ui_hidden: bool = False,
    **kwargs: Any,
) -> Any:
    """
    Creates an output field for an invocation output.

    This is a wrapper for Pydantic's [Field](https://docs.pydantic.dev/1.10/usage/schema/#field-customization) \
    that adds a few extra parameters to support graph execution and the node editor UI.

    :param UITypeHint ui_type_hint: [None] Optionally provides an extra type hint for the UI. \
      In some situations, the field's type is not enough to infer the correct UI type. \
      For example, an `integer` field may be "any" integer, or a seed, which has built-in constraints. \
      For this case, you could use `UITypeHint.Seed` to indicate that the field is a seed. \

    : param bool ui_hidden: [False] Specifies whether or not this field should be hidden in the UI. \
    """
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


InputField.__doc__ = str(InputField.__doc__) + str(Field.__doc__)


class UIConfigBase(BaseModel):
    """Provides additional node configuration to the UI."""

    tags: Optional[list[str]] = Field(default_factory=None, description="The tags to display in the UI")
    title: Optional[str] = Field(default=None, description="The display name of the node")


def title(title):
    """Adds a title to the invocation. Use this to override the default title generation, which is based on the class name."""

    def wrapper(cls):
        uiconf_name = cls.__qualname__ + ".UIConfig"
        if not hasattr(cls, "UIConfig") or cls.UIConfig.__qualname__ != uiconf_name:
            cls.UIConfig = type(uiconf_name, (UIConfigBase,), dict())
        cls.UIConfig.title = title
        return cls

    # def wrapper(cls):
    #     if not hasattr(cls, "UIConfig"):
    #         cls.UIConfig = type(cls.__qualname__ + ".UIConfig", (UIConfigBase,), dict())
    #     cls.UIConfig.title = title
    #     return cls

    return wrapper


def tags(*tags: str):
    """Adds tags to the invocation. Use this to improve the streamline finding the invocation in the UI."""

    def wrapper(cls):
        if not hasattr(cls, "UIConfig"):
            cls.UIConfig = type(cls.__qualname__ + ".UIConfig", (UIConfigBase,), dict())
        cls.UIConfig.tags = list(tags)
        return cls

    return wrapper


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
                _input = field.field_info.extra.get("input", None)
                if _input in [Input.Connection, Input.Any] and field.required:
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
            _input = field.field_info.extra.get("input", None)
            if field.required and not hasattr(self, field_name):
                if _input == Input.Connection:
                    raise RequiredConnectionException(self.__fields__["type"].default, field_name)
                elif _input == Input.Any:
                    raise MissingInputException(self.__fields__["type"].default, field_name)
        return self.invoke(context)

    id: str = InputField(description="The id of this node. Must be unique among all nodes.")
    is_intermediate: bool = InputField(
        default=False, description="Whether or not this node is an intermediate node.", input=Input.Direct
    )
