import copy
from typing import List, Literal, Optional

from pydantic import BaseModel, Field

from ...backend.model_management import BaseModelType, ModelType, SubModelType
from .baseinvocation import (
    BaseInvocation,
    BaseInvocationOutput,
    FieldDescriptions,
    InputField,
    Input,
    InvocationContext,
    OutputField,
    UIType,
    tags,
    title,
)


class ModelInfo(BaseModel):
    model_name: str = Field(description="Info to load submodel")
    base_model: BaseModelType = Field(description="Base model")
    model_type: ModelType = Field(description="Info to load submodel")
    submodel: Optional[SubModelType] = Field(default=None, description="Info to load submodel")


class LoraInfo(ModelInfo):
    weight: float = Field(description="Lora's weight which to use when apply to model")


class UNetField(BaseModel):
    unet: ModelInfo = Field(description="Info to load unet submodel")
    scheduler: ModelInfo = Field(description="Info to load scheduler submodel")
    loras: List[LoraInfo] = Field(description="Loras to apply on model loading")


class ClipField(BaseModel):
    tokenizer: ModelInfo = Field(description="Info to load tokenizer submodel")
    text_encoder: ModelInfo = Field(description="Info to load text_encoder submodel")
    skipped_layers: int = Field(description="Number of skipped layers in text_encoder")
    loras: List[LoraInfo] = Field(description="Loras to apply on model loading")


class VaeField(BaseModel):
    # TODO: better naming?
    vae: ModelInfo = Field(description="Info to load vae submodel")


class ModelLoaderOutput(BaseInvocationOutput):
    """Model loader output"""

    type: Literal["model_loader_output"] = "model_loader_output"

    unet: UNetField = OutputField(description=FieldDescriptions.unet, title="UNet")
    clip: ClipField = OutputField(description=FieldDescriptions.clip, title="CLIP")
    vae: VaeField = OutputField(description=FieldDescriptions.vae, title="VAE")


class MainModelField(BaseModel):
    """Main model field"""

    model_name: str = Field(description="Name of the model")
    base_model: BaseModelType = Field(description="Base model")
    model_type: ModelType = Field(description="Model Type")


class LoRAModelField(BaseModel):
    """LoRA model field"""

    model_name: str = Field(description="Name of the LoRA model")
    base_model: BaseModelType = Field(description="Base model")


@title("Main Model")
@tags("model")
class MainModelLoaderInvocation(BaseInvocation):
    """Loads a main model, outputting its submodels."""

    type: Literal["main_model_loader"] = "main_model_loader"

    # Inputs
    model: MainModelField = InputField(description=FieldDescriptions.main_model, input=Input.Direct)
    # TODO: precision?

    def invoke(self, context: InvocationContext) -> ModelLoaderOutput:
        base_model = self.model.base_model
        model_name = self.model.model_name
        model_type = ModelType.Main

        # TODO: not found exceptions
        if not context.services.model_manager.model_exists(
            model_name=model_name,
            base_model=base_model,
            model_type=model_type,
        ):
            raise Exception(f"Unknown {base_model} {model_type} model: {model_name}")

        """
        if not context.services.model_manager.model_exists(
            model_name=self.model_name,
            model_type=SDModelType.Diffusers,
            submodel=SDModelType.Tokenizer,
        ):
            raise Exception(
                f"Failed to find tokenizer submodel in {self.model_name}! Check if model corrupted"
            )

        if not context.services.model_manager.model_exists(
            model_name=self.model_name,
            model_type=SDModelType.Diffusers,
            submodel=SDModelType.TextEncoder,
        ):
            raise Exception(
                f"Failed to find text_encoder submodel in {self.model_name}! Check if model corrupted"
            )

        if not context.services.model_manager.model_exists(
            model_name=self.model_name,
            model_type=SDModelType.Diffusers,
            submodel=SDModelType.UNet,
        ):
            raise Exception(
                f"Failed to find unet submodel from {self.model_name}! Check if model corrupted"
            )
        """

        return ModelLoaderOutput(
            unet=UNetField(
                unet=ModelInfo(
                    model_name=model_name,
                    base_model=base_model,
                    model_type=model_type,
                    submodel=SubModelType.UNet,
                ),
                scheduler=ModelInfo(
                    model_name=model_name,
                    base_model=base_model,
                    model_type=model_type,
                    submodel=SubModelType.Scheduler,
                ),
                loras=[],
            ),
            clip=ClipField(
                tokenizer=ModelInfo(
                    model_name=model_name,
                    base_model=base_model,
                    model_type=model_type,
                    submodel=SubModelType.Tokenizer,
                ),
                text_encoder=ModelInfo(
                    model_name=model_name,
                    base_model=base_model,
                    model_type=model_type,
                    submodel=SubModelType.TextEncoder,
                ),
                loras=[],
                skipped_layers=0,
            ),
            vae=VaeField(
                vae=ModelInfo(
                    model_name=model_name,
                    base_model=base_model,
                    model_type=model_type,
                    submodel=SubModelType.Vae,
                ),
            ),
        )


class LoraLoaderOutput(BaseInvocationOutput):
    """Model loader output"""

    # fmt: off
    type: Literal["lora_loader_output"] = "lora_loader_output"

    unet: Optional[UNetField] = OutputField(default=None, description=FieldDescriptions.unet, title="UNet")
    clip: Optional[ClipField] = OutputField(default=None, description=FieldDescriptions.clip, title="CLIP")
    # fmt: on


@title("LoRA")
@tags("lora", "model")
class LoraLoaderInvocation(BaseInvocation):
    """Apply selected lora to unet and text_encoder."""

    type: Literal["lora_loader"] = "lora_loader"

    # Inputs
    lora: LoRAModelField = InputField(description=FieldDescriptions.lora_model, input=Input.Direct, title="LoRA")
    weight: float = InputField(default=0.75, description=FieldDescriptions.lora_weight)
    unet: Optional[UNetField] = InputField(
        default=None, description=FieldDescriptions.unet, input=Input.Connection, title="UNet"
    )
    clip: Optional[ClipField] = InputField(
        default=None, description=FieldDescriptions.clip, input=Input.Connection, title="CLIP"
    )

    def invoke(self, context: InvocationContext) -> LoraLoaderOutput:
        if self.lora is None:
            raise Exception("No LoRA provided")

        base_model = self.lora.base_model
        lora_name = self.lora.model_name

        if not context.services.model_manager.model_exists(
            base_model=base_model,
            model_name=lora_name,
            model_type=ModelType.Lora,
        ):
            raise Exception(f"Unkown lora name: {lora_name}!")

        if self.unet is not None and any(lora.model_name == lora_name for lora in self.unet.loras):
            raise Exception(f'Lora "{lora_name}" already applied to unet')

        if self.clip is not None and any(lora.model_name == lora_name for lora in self.clip.loras):
            raise Exception(f'Lora "{lora_name}" already applied to clip')

        output = LoraLoaderOutput()

        if self.unet is not None:
            output.unet = copy.deepcopy(self.unet)
            output.unet.loras.append(
                LoraInfo(
                    base_model=base_model,
                    model_name=lora_name,
                    model_type=ModelType.Lora,
                    submodel=None,
                    weight=self.weight,
                )
            )

        if self.clip is not None:
            output.clip = copy.deepcopy(self.clip)
            output.clip.loras.append(
                LoraInfo(
                    base_model=base_model,
                    model_name=lora_name,
                    model_type=ModelType.Lora,
                    submodel=None,
                    weight=self.weight,
                )
            )

        return output


class SDXLLoraLoaderOutput(BaseInvocationOutput):
    """SDXL LoRA Loader Output"""

    # fmt: off
    type: Literal["sdxl_lora_loader_output"] = "sdxl_lora_loader_output"

    unet: Optional[UNetField] = OutputField(default=None, description=FieldDescriptions.unet, title="UNet")
    clip: Optional[ClipField] = OutputField(default=None, description=FieldDescriptions.clip, title="CLIP 1")
    clip2: Optional[ClipField] = OutputField(default=None, description=FieldDescriptions.clip, title="CLIP 2")
    # fmt: on


@title("SDXL LoRA")
@tags("sdxl", "lora", "model")
class SDXLLoraLoaderInvocation(BaseInvocation):
    """Apply selected lora to unet and text_encoder."""

    type: Literal["sdxl_lora_loader"] = "sdxl_lora_loader"

    lora: LoRAModelField = InputField(description=FieldDescriptions.lora_model, input=Input.Direct, title="LoRA")
    weight: float = Field(default=0.75, description=FieldDescriptions.lora_weight)
    unet: Optional[UNetField] = Field(
        default=None, description=FieldDescriptions.unet, input=Input.Connection, title="UNET"
    )
    clip: Optional[ClipField] = Field(
        default=None, description=FieldDescriptions.clip, input=Input.Connection, title="CLIP 1"
    )
    clip2: Optional[ClipField] = Field(
        default=None, description=FieldDescriptions.clip, input=Input.Connection, title="CLIP 2"
    )

    def invoke(self, context: InvocationContext) -> SDXLLoraLoaderOutput:
        if self.lora is None:
            raise Exception("No LoRA provided")

        base_model = self.lora.base_model
        lora_name = self.lora.model_name

        if not context.services.model_manager.model_exists(
            base_model=base_model,
            model_name=lora_name,
            model_type=ModelType.Lora,
        ):
            raise Exception(f"Unknown lora name: {lora_name}!")

        if self.unet is not None and any(lora.model_name == lora_name for lora in self.unet.loras):
            raise Exception(f'Lora "{lora_name}" already applied to unet')

        if self.clip is not None and any(lora.model_name == lora_name for lora in self.clip.loras):
            raise Exception(f'Lora "{lora_name}" already applied to clip')

        if self.clip2 is not None and any(lora.model_name == lora_name for lora in self.clip2.loras):
            raise Exception(f'Lora "{lora_name}" already applied to clip2')

        output = SDXLLoraLoaderOutput()

        if self.unet is not None:
            output.unet = copy.deepcopy(self.unet)
            output.unet.loras.append(
                LoraInfo(
                    base_model=base_model,
                    model_name=lora_name,
                    model_type=ModelType.Lora,
                    submodel=None,
                    weight=self.weight,
                )
            )

        if self.clip is not None:
            output.clip = copy.deepcopy(self.clip)
            output.clip.loras.append(
                LoraInfo(
                    base_model=base_model,
                    model_name=lora_name,
                    model_type=ModelType.Lora,
                    submodel=None,
                    weight=self.weight,
                )
            )

        if self.clip2 is not None:
            output.clip2 = copy.deepcopy(self.clip2)
            output.clip2.loras.append(
                LoraInfo(
                    base_model=base_model,
                    model_name=lora_name,
                    model_type=ModelType.Lora,
                    submodel=None,
                    weight=self.weight,
                )
            )

        return output


class VAEModelField(BaseModel):
    """Vae model field"""

    model_name: str = Field(description="Name of the model")
    base_model: BaseModelType = Field(description="Base model")


class VaeLoaderOutput(BaseInvocationOutput):
    """Model loader output"""

    type: Literal["vae_loader_output"] = "vae_loader_output"

    # Outputs
    vae: VaeField = OutputField(description=FieldDescriptions.vae, title="VAE")


@title("VAE")
@tags("vae", "model")
class VaeLoaderInvocation(BaseInvocation):
    """Loads a VAE model, outputting a VaeLoaderOutput"""

    type: Literal["vae_loader"] = "vae_loader"

    # Inputs
    vae_model: VAEModelField = InputField(
        description=FieldDescriptions.vae_model, input=Input.Direct, ui_type=UIType.VaeModel, title="VAE"
    )

    def invoke(self, context: InvocationContext) -> VaeLoaderOutput:
        base_model = self.vae_model.base_model
        model_name = self.vae_model.model_name
        model_type = ModelType.Vae

        if not context.services.model_manager.model_exists(
            base_model=base_model,
            model_name=model_name,
            model_type=model_type,
        ):
            raise Exception(f"Unkown vae name: {model_name}!")
        return VaeLoaderOutput(
            vae=VaeField(
                vae=ModelInfo(
                    model_name=model_name,
                    base_model=base_model,
                    model_type=model_type,
                )
            )
        )
