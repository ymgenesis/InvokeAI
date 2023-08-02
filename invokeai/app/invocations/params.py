# Copyright (c) 2023 Kyle Schouviller (https://github.com/kyle0654)

from typing import Literal

from invokeai.app.invocations.prompt import PromptOutput

from .baseinvocation import (
    BaseInvocation,
    BaseInvocationOutput,
    InputField,
    InvocationContext,
    OutputField,
    Tags,
    Title,
)
from .math import FloatOutput, IntOutput

# Pass-through parameter nodes - used by subgraphs


class ParamIntInvocation(BaseInvocation):
    """An integer parameter"""

    type: Literal["param_int"] = "param_int"
    title = Title("Integer Parameter")
    tags = Tags(["integer"])

    # Inputs
    a: int = InputField(default=0, description="The integer value")

    def invoke(self, context: InvocationContext) -> IntOutput:
        return IntOutput(a=self.a)


class ParamFloatInvocation(BaseInvocation):
    """A float parameter"""

    type: Literal["param_float"] = "param_float"
    title = Title("Float Parameter")
    tags = Tags(["float"])

    # Inputs
    param: float = InputField(default=0.0, description="The float value")

    def invoke(self, context: InvocationContext) -> FloatOutput:
        return FloatOutput(a=self.param)


class StringOutput(BaseInvocationOutput):
    """A string output"""

    type: Literal["string_output"] = "string_output"
    text: str = OutputField(default=None, description="The output string")


class ParamStringInvocation(BaseInvocation):
    """A string parameter"""

    type: Literal["param_string"] = "param_string"
    title = Title("String Parameter")
    tags = Tags(["string"])

    # Inputs
    text: str = InputField(default="", description="The string value")

    def invoke(self, context: InvocationContext) -> StringOutput:
        return StringOutput(text=self.text)


class ParamPromptInvocation(BaseInvocation):
    """A prompt input parameter"""

    type: Literal["param_prompt"] = "param_prompt"
    title = Title("Prompt Parameter")
    tags = Tags(["prompt"])

    # Inputs
    prompt: str = InputField(default="", description="The prompt value")

    def invoke(self, context: InvocationContext) -> PromptOutput:
        return PromptOutput(prompt=self.prompt)
