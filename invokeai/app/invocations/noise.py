# Copyright (c) 2023 Kyle Schouviller (https://github.com/kyle0654) & the InvokeAI Team


import torch
from pydantic import validator

from invokeai.app.invocations.latent import LatentsField
from invokeai.app.util.misc import SEED_MAX, get_random_seed

from ...backend.util.devices import choose_torch_device, torch_dtype
from .baseinvocation import (
    BaseInvocation,
    BaseInvocationOutput,
    FieldDescriptions,
    InputField,
    InvocationContext,
    OutputField,
    invocation,
    invocation_output,
)

"""
Utilities
"""


def get_noise(
    width: int,
    height: int,
    device: torch.device,
    seed: int = 0,
    latent_channels: int = 4,
    downsampling_factor: int = 8,
    use_cpu: bool = True,
    perlin: float = 0.0,
):
    """Generate noise for a given image size."""
    noise_device_type = "cpu" if use_cpu else device.type

    # limit noise to only the diffusion image channels, not the mask channels
    input_channels = min(latent_channels, 4)
    generator = torch.Generator(device=noise_device_type).manual_seed(seed)

    noise_tensor = torch.randn(
        [
            1,
            input_channels,
            height // downsampling_factor,
            width // downsampling_factor,
        ],
        dtype=torch_dtype(device),
        device=noise_device_type,
        generator=generator,
    ).to("cpu")

    return noise_tensor


"""
Nodes
"""


@invocation_output("noise_output")
class NoiseOutput(BaseInvocationOutput):
    """Invocation noise output"""

    noise: LatentsField = OutputField(default=None, description=FieldDescriptions.noise)
    width: int = OutputField(description=FieldDescriptions.width)
    height: int = OutputField(description=FieldDescriptions.height)


def build_noise_output(latents_name: str, latents: torch.Tensor, seed: int):
    return NoiseOutput(
        noise=LatentsField(latents_name=latents_name, seed=seed),
        width=latents.size()[3] * 8,
        height=latents.size()[2] * 8,
    )


@invocation("noise", title="Noise", tags=["latents", "noise"], category="latents", version="1.0.0")
class NoiseInvocation(BaseInvocation):
    """Generates latent noise."""

    seed: int = InputField(
        ge=0,
        le=SEED_MAX,
        description=FieldDescriptions.seed,
        default_factory=get_random_seed,
    )
    width: int = InputField(
        default=512,
        multiple_of=8,
        gt=0,
        description=FieldDescriptions.width,
    )
    height: int = InputField(
        default=512,
        multiple_of=8,
        gt=0,
        description=FieldDescriptions.height,
    )
    use_cpu: bool = InputField(
        default=True,
        description="Use CPU for noise generation (for reproducible results across platforms)",
    )

    @validator("seed", pre=True)
    def modulo_seed(cls, v):
        """Returns the seed modulo (SEED_MAX + 1) to ensure it is within the valid range."""
        return v % (SEED_MAX + 1)

    def invoke(self, context: InvocationContext) -> NoiseOutput:
        noise = get_noise(
            width=self.width,
            height=self.height,
            device=choose_torch_device(),
            seed=self.seed,
            use_cpu=self.use_cpu,
        )
        name = f"{context.graph_execution_state_id}__{self.id}"
        context.services.latents.save(name, noise)
        return build_noise_output(latents_name=name, latents=noise, seed=self.seed)
