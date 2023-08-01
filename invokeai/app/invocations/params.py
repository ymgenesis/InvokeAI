# Copyright (c) 2023 Kyle Schouviller (https://github.com/kyle0654)

from typing import Literal

from pydantic import Field

from invokeai.app.invocations.prompt import PromptOutput

from .baseinvocation import BaseInvocation, BaseInvocationOutput, InvocationContext, UINodeConfig
from .math import FloatOutput, IntOutput

# Pass-through parameter nodes - used by subgraphs


class ParamIntInvocation(BaseInvocation):
    """An integer parameter"""

    type: Literal["param_int"] = "param_int"

    # Inputs
    a: int = Field(default=0, description="The integer value")

    # Schema Customisation
    class Config:
        schema_extra = {
            "ui": UINodeConfig(
                title="Integer Parameter",
                tags=["integer"],
            )
        }

    def invoke(self, context: InvocationContext) -> IntOutput:
        return IntOutput(a=self.a)


class ParamFloatInvocation(BaseInvocation):
    """A float parameter"""

    type: Literal["param_float"] = "param_float"

    # Inputs
    param: float = Field(default=0.0, description="The float value")

    # Schema Customisation
    class Config:
        schema_extra = {
            "ui": UINodeConfig(
                title="Float Parameter",
                tags=["float"],
            )
        }

    def invoke(self, context: InvocationContext) -> FloatOutput:
        return FloatOutput(param=self.param)


class StringOutput(BaseInvocationOutput):
    """A string output"""

    type: Literal["string_output"] = "string_output"
    text: str = Field(default=None, description="The output string")


class ParamStringInvocation(BaseInvocation):
    """A string parameter"""

    type: Literal["param_string"] = "param_string"

    # Inputs
    text: str = Field(default="", description="The string value")

    # Schema Customisation
    class Config:
        schema_extra = {
            "ui": UINodeConfig(
                title="String Parameter",
                tags=["string"],
            )
        }

    def invoke(self, context: InvocationContext) -> StringOutput:
        return StringOutput(text=self.text)


class ParamPromptInvocation(BaseInvocation):
    """A prompt input parameter"""

    type: Literal["param_prompt"] = "param_prompt"

    # Inputs
    prompt: str = Field(default="", description="The prompt value")

    # Schema Customisation
    class Config:
        schema_extra = {
            "ui": UINodeConfig(
                title="Prompt Parameter",
                tags=["prompt", "integer"],
            )
        }

    def invoke(self, context: InvocationContext) -> PromptOutput:
        return PromptOutput(prompt=self.prompt)
