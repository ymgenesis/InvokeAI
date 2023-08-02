# Copyright (c) 2023 Kyle Schouviller (https://github.com/kyle0654)

from typing import Literal

import numpy as np

from .baseinvocation import (
    BaseInvocation,
    BaseInvocationOutput,
    InputField,
    InvocationContext,
    OutputField,
    Tags,
    Title,
)


class IntOutput(BaseInvocationOutput):
    """An integer output"""

    type: Literal["int_output"] = "int_output"
    a: int = OutputField(default=None, description="The output integer")


class FloatOutput(BaseInvocationOutput):
    """A float output"""

    type: Literal["float_output"] = "float_output"
    a: float = OutputField(default=None, description="The output float")


class AddInvocation(BaseInvocation):
    """Adds two numbers"""

    type: Literal["add"] = "add"
    title = Title("Add Integers")
    tags = Tags(["math"])

    # Inputs
    a: int = InputField(default=0, description="The first number")
    b: int = InputField(default=0, description="The second number")

    def invoke(self, context: InvocationContext) -> IntOutput:
        return IntOutput(a=self.a + self.b)


class SubtractInvocation(BaseInvocation):
    """Subtracts two numbers"""

    type: Literal["sub"] = "sub"
    title = Title("Subtract Integers")
    tags = Tags(["math"])

    # Inputs
    a: int = InputField(default=0, description="The first number")
    b: int = InputField(default=0, description="The second number")

    def invoke(self, context: InvocationContext) -> IntOutput:
        return IntOutput(a=self.a - self.b)


class MultiplyInvocation(BaseInvocation):
    """Multiplies two numbers"""

    type: Literal["mul"] = "mul"
    title = Title("Multiply Integers")
    tags = Tags(["math"])

    # Inputs
    a: int = InputField(default=0, description="The first number")
    b: int = InputField(default=0, description="The second number")

    def invoke(self, context: InvocationContext) -> IntOutput:
        return IntOutput(a=self.a * self.b)


class DivideInvocation(BaseInvocation):
    """Divides two numbers"""

    type: Literal["div"] = "div"
    title = Title("Divide Integers")
    tags = Tags(["math"])

    # Inputs
    a: int = InputField(default=0, description="The first number")
    b: int = InputField(default=0, description="The second number")

    def invoke(self, context: InvocationContext) -> IntOutput:
        return IntOutput(a=int(self.a / self.b))


class RandomIntInvocation(BaseInvocation):
    """Outputs a single random integer."""

    type: Literal["rand_int"] = "rand_int"
    title = Title("Random Integer")
    tags = Tags(["math"])

    # Inputs
    low: int = InputField(default=0, description="The inclusive low value")
    high: int = InputField(default=np.iinfo(np.int32).max, description="The exclusive high value")

    def invoke(self, context: InvocationContext) -> IntOutput:
        return IntOutput(a=np.random.randint(self.low, self.high))
