from typing import Union

from pydantic import BaseModel, ConfigDict, Field

from invokeai.app.invocations.baseinvocation import (
    BaseInvocation,
    BaseInvocationOutput,
    FieldDescriptions,
    Input,
    InputField,
    InvocationContext,
    OutputField,
    UIType,
    invocation,
    invocation_output,
)
from invokeai.app.invocations.controlnet_image_processors import CONTROLNET_RESIZE_VALUES
from invokeai.app.invocations.primitives import ImageField
from invokeai.backend.model_management.models.base import BaseModelType


class T2IAdapterModelField(BaseModel):
    model_name: str = Field(description="Name of the T2I-Adapter model")
    base_model: BaseModelType = Field(description="Base model")

    model_config = ConfigDict(protected_namespaces=())


class T2IAdapterField(BaseModel):
    image: ImageField = Field(description="The T2I-Adapter image prompt.")
    t2i_adapter_model: T2IAdapterModelField = Field(description="The T2I-Adapter model to use.")
    weight: Union[float, list[float]] = Field(default=1, description="The weight given to the T2I-Adapter")
    begin_step_percent: float = Field(
        default=0, ge=0, le=1, description="When the T2I-Adapter is first applied (% of total steps)"
    )
    end_step_percent: float = Field(
        default=1, ge=0, le=1, description="When the T2I-Adapter is last applied (% of total steps)"
    )
    resize_mode: CONTROLNET_RESIZE_VALUES = Field(default="just_resize", description="The resize mode to use")


@invocation_output("t2i_adapter_output")
class T2IAdapterOutput(BaseInvocationOutput):
    t2i_adapter: T2IAdapterField = OutputField(description=FieldDescriptions.t2i_adapter, title="T2I Adapter")


@invocation(
    "t2i_adapter", title="T2I-Adapter", tags=["t2i_adapter", "control"], category="t2i_adapter", version="1.0.0"
)
class T2IAdapterInvocation(BaseInvocation):
    """Collects T2I-Adapter info to pass to other nodes."""

    # Inputs
    image: ImageField = InputField(description="The IP-Adapter image prompt.")
    t2i_adapter_model: T2IAdapterModelField = InputField(
        description="The T2I-Adapter model.",
        title="T2I-Adapter Model",
        input=Input.Direct,
        ui_order=-1,
    )
    weight: Union[float, list[float]] = InputField(
        default=1, ge=0, description="The weight given to the T2I-Adapter", ui_type=UIType.Float, title="Weight"
    )
    begin_step_percent: float = InputField(
        default=0, ge=-1, le=2, description="When the T2I-Adapter is first applied (% of total steps)"
    )
    end_step_percent: float = InputField(
        default=1, ge=0, le=1, description="When the T2I-Adapter is last applied (% of total steps)"
    )
    resize_mode: CONTROLNET_RESIZE_VALUES = InputField(
        default="just_resize",
        description="The resize mode applied to the T2I-Adapter input image so that it matches the target output size.",
    )

    def invoke(self, context: InvocationContext) -> T2IAdapterOutput:
        return T2IAdapterOutput(
            t2i_adapter=T2IAdapterField(
                image=self.image,
                t2i_adapter_model=self.t2i_adapter_model,
                weight=self.weight,
                begin_step_percent=self.begin_step_percent,
                end_step_percent=self.end_step_percent,
                resize_mode=self.resize_mode,
            )
        )
