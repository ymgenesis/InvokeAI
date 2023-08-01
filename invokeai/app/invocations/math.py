# Copyright (c) 2023 Kyle Schouviller (https://github.com/kyle0654)

from typing import Literal

from pydantic import BaseModel, Field
import numpy as np

from .baseinvocation import (
    BaseInvocation,
    BaseInvocationOutput,
    InvocationContext,
    UINodeConfig,
)


class IntOutput(BaseInvocationOutput):
    """An integer output"""

    type: Literal["int_output"] = "int_output"
    a: int = Field(default=None, description="The output integer")


class FloatOutput(BaseInvocationOutput):
    """A float output"""

    type: Literal["float_output"] = "float_output"
    a: float = Field(default=None, description="The output float")


class AddInvocation(BaseInvocation):
    """Adds two numbers"""

    type: Literal["add"] = "add"

    # Inputs
    a: int = Field(default=0, description="The first number")
    b: int = Field(default=0, description="The second number")

    # Schema Customisation
    class Config:
        schema_extra = {"ui": UINodeConfig(title="Add", tags=["math"])}

    def invoke(self, context: InvocationContext) -> IntOutput:
        return IntOutput(a=self.a + self.b)


class SubtractInvocation(BaseInvocation):
    """Subtracts two numbers"""

    type: Literal["sub"] = "sub"

    # Inputs
    a: int = Field(default=0, description="The first number")
    b: int = Field(default=0, description="The second number")

    # Schema Customisation
    class Config:
        schema_extra = {"ui": UINodeConfig(title="Subtract", tags=["math"])}

    def invoke(self, context: InvocationContext) -> IntOutput:
        return IntOutput(a=self.a - self.b)


class MultiplyInvocation(BaseInvocation):
    """Multiplies two numbers"""

    type: Literal["mul"] = "mul"

    # Inputs
    a: int = Field(default=0, description="The first number")
    b: int = Field(default=0, description="The second number")

    # Schema Customisation
    class Config:
        schema_extra = {"ui": UINodeConfig(title="Multiply", tags=["math"])}

    def invoke(self, context: InvocationContext) -> IntOutput:
        return IntOutput(a=self.a * self.b)


class DivideInvocation(BaseInvocation):
    """Divides two numbers"""

    type: Literal["div"] = "div"

    # Inputs
    a: int = Field(default=0, description="The first number")
    b: int = Field(default=0, description="The second number")

    # Schema Customisation
    class Config:
        schema_extra = {"ui": UINodeConfig(title="Divide", tags=["math"])}

    def invoke(self, context: InvocationContext) -> IntOutput:
        return IntOutput(a=int(self.a / self.b))


class RandomIntInvocation(BaseInvocation):
    """Outputs a single random integer."""

    type: Literal["rand_int"] = "rand_int"

    # Inputs
    low: int = Field(default=0, description="The inclusive low value")
    high: int = Field(default=np.iinfo(np.int32).max, description="The exclusive high value")

    # Schema Customisation
    class Config:
        schema_extra = {"ui": UINodeConfig(title="Random Integer", tags=["math", "random", "integer"])}

    def invoke(self, context: InvocationContext) -> IntOutput:
        return IntOutput(a=np.random.randint(self.low, self.high))
