import bisect
import os
from enum import Enum
from pathlib import Path
from typing import Dict, Optional, Union

import torch
from safetensors.torch import load_file

from .base import (
    BaseModelType,
    InvalidModelException,
    ModelBase,
    ModelConfigBase,
    ModelNotFoundException,
    ModelType,
    SubModelType,
    classproperty,
)


class LoRAModelFormat(str, Enum):
    LyCORIS = "lycoris"
    Diffusers = "diffusers"


class LoRAModel(ModelBase):
    # model_size: int

    class Config(ModelConfigBase):
        model_format: LoRAModelFormat  # TODO:

    def __init__(self, model_path: str, base_model: BaseModelType, model_type: ModelType):
        assert model_type == ModelType.Lora
        super().__init__(model_path, base_model, model_type)

        self.model_size = os.path.getsize(self.model_path)

    def get_size(self, child_type: Optional[SubModelType] = None):
        if child_type is not None:
            raise Exception("There is no child models in lora")
        return self.model_size

    def get_model(
        self,
        torch_dtype: Optional[torch.dtype],
        child_type: Optional[SubModelType] = None,
    ):
        if child_type is not None:
            raise Exception("There is no child models in lora")

        model = LoRAModelRaw.from_checkpoint(
            file_path=self.model_path,
            dtype=torch_dtype,
            base_model=self.base_model,
        )

        self.model_size = model.calc_size()
        return model

    @classproperty
    def save_to_config(cls) -> bool:
        return True

    @classmethod
    def detect_format(cls, path: str):
        if not os.path.exists(path):
            raise ModelNotFoundException()

        if os.path.isdir(path):
            if os.path.exists(os.path.join(path, "pytorch_lora_weights.bin")):
                return LoRAModelFormat.Diffusers

        if os.path.isfile(path):
            if any([path.endswith(f".{ext}") for ext in ["safetensors", "ckpt", "pt"]]):
                return LoRAModelFormat.LyCORIS

        raise InvalidModelException(f"Not a valid model: {path}")

    @classmethod
    def convert_if_required(
        cls,
        model_path: str,
        output_path: str,
        config: ModelConfigBase,
        base_model: BaseModelType,
    ) -> str:
        if cls.detect_format(model_path) == LoRAModelFormat.Diffusers:
            # TODO: add diffusers lora when it stabilizes a bit
            raise NotImplementedError("Diffusers lora not supported")
        else:
            return model_path


class LoRALayerBase:
    # rank: Optional[int]
    # alpha: Optional[float]
    # bias: Optional[torch.Tensor]
    # layer_key: str

    # @property
    # def scale(self):
    #    return self.alpha / self.rank if (self.alpha and self.rank) else 1.0

    def __init__(
        self,
        layer_key: str,
        values: dict,
    ):
        if "alpha" in values:
            self.alpha = values["alpha"].item()
        else:
            self.alpha = None

        if "bias_indices" in values and "bias_values" in values and "bias_size" in values:
            self.bias = torch.sparse_coo_tensor(
                values["bias_indices"],
                values["bias_values"],
                tuple(values["bias_size"]),
            )

        else:
            self.bias = None

        self.rank = None  # set in layer implementation
        self.layer_key = layer_key

    def get_weight(self, orig_weight: torch.Tensor):
        raise NotImplementedError()

    def calc_size(self) -> int:
        model_size = 0
        for val in [self.bias]:
            if val is not None:
                model_size += val.nelement() * val.element_size()
        return model_size

    def to(
        self,
        device: Optional[torch.device] = None,
        dtype: Optional[torch.dtype] = None,
    ):
        if self.bias is not None:
            self.bias = self.bias.to(device=device, dtype=dtype)


# TODO: find and debug lora/locon with bias
class LoRALayer(LoRALayerBase):
    # up: torch.Tensor
    # mid: Optional[torch.Tensor]
    # down: torch.Tensor

    def __init__(
        self,
        layer_key: str,
        values: dict,
    ):
        super().__init__(layer_key, values)

        self.up = values["lora_up.weight"]
        self.down = values["lora_down.weight"]
        if "lora_mid.weight" in values:
            self.mid = values["lora_mid.weight"]
        else:
            self.mid = None

        self.rank = self.down.shape[0]

    def get_weight(self, orig_weight: torch.Tensor):
        if self.mid is not None:
            up = self.up.reshape(self.up.shape[0], self.up.shape[1])
            down = self.down.reshape(self.down.shape[0], self.down.shape[1])
            weight = torch.einsum("m n w h, i m, n j -> i j w h", self.mid, up, down)
        else:
            weight = self.up.reshape(self.up.shape[0], -1) @ self.down.reshape(self.down.shape[0], -1)

        return weight

    def calc_size(self) -> int:
        model_size = super().calc_size()
        for val in [self.up, self.mid, self.down]:
            if val is not None:
                model_size += val.nelement() * val.element_size()
        return model_size

    def to(
        self,
        device: Optional[torch.device] = None,
        dtype: Optional[torch.dtype] = None,
    ):
        super().to(device=device, dtype=dtype)

        self.up = self.up.to(device=device, dtype=dtype)
        self.down = self.down.to(device=device, dtype=dtype)

        if self.mid is not None:
            self.mid = self.mid.to(device=device, dtype=dtype)


class LoHALayer(LoRALayerBase):
    # w1_a: torch.Tensor
    # w1_b: torch.Tensor
    # w2_a: torch.Tensor
    # w2_b: torch.Tensor
    # t1: Optional[torch.Tensor] = None
    # t2: Optional[torch.Tensor] = None

    def __init__(
        self,
        layer_key: str,
        values: dict,
    ):
        super().__init__(layer_key, values)

        self.w1_a = values["hada_w1_a"]
        self.w1_b = values["hada_w1_b"]
        self.w2_a = values["hada_w2_a"]
        self.w2_b = values["hada_w2_b"]

        if "hada_t1" in values:
            self.t1 = values["hada_t1"]
        else:
            self.t1 = None

        if "hada_t2" in values:
            self.t2 = values["hada_t2"]
        else:
            self.t2 = None

        self.rank = self.w1_b.shape[0]

    def get_weight(self, orig_weight: torch.Tensor):
        if self.t1 is None:
            weight = (self.w1_a @ self.w1_b) * (self.w2_a @ self.w2_b)

        else:
            rebuild1 = torch.einsum("i j k l, j r, i p -> p r k l", self.t1, self.w1_b, self.w1_a)
            rebuild2 = torch.einsum("i j k l, j r, i p -> p r k l", self.t2, self.w2_b, self.w2_a)
            weight = rebuild1 * rebuild2

        return weight

    def calc_size(self) -> int:
        model_size = super().calc_size()
        for val in [self.w1_a, self.w1_b, self.w2_a, self.w2_b, self.t1, self.t2]:
            if val is not None:
                model_size += val.nelement() * val.element_size()
        return model_size

    def to(
        self,
        device: Optional[torch.device] = None,
        dtype: Optional[torch.dtype] = None,
    ):
        super().to(device=device, dtype=dtype)

        self.w1_a = self.w1_a.to(device=device, dtype=dtype)
        self.w1_b = self.w1_b.to(device=device, dtype=dtype)
        if self.t1 is not None:
            self.t1 = self.t1.to(device=device, dtype=dtype)

        self.w2_a = self.w2_a.to(device=device, dtype=dtype)
        self.w2_b = self.w2_b.to(device=device, dtype=dtype)
        if self.t2 is not None:
            self.t2 = self.t2.to(device=device, dtype=dtype)


class LoKRLayer(LoRALayerBase):
    # w1: Optional[torch.Tensor] = None
    # w1_a: Optional[torch.Tensor] = None
    # w1_b: Optional[torch.Tensor] = None
    # w2: Optional[torch.Tensor] = None
    # w2_a: Optional[torch.Tensor] = None
    # w2_b: Optional[torch.Tensor] = None
    # t2: Optional[torch.Tensor] = None

    def __init__(
        self,
        layer_key: str,
        values: dict,
    ):
        super().__init__(layer_key, values)

        if "lokr_w1" in values:
            self.w1 = values["lokr_w1"]
            self.w1_a = None
            self.w1_b = None
        else:
            self.w1 = None
            self.w1_a = values["lokr_w1_a"]
            self.w1_b = values["lokr_w1_b"]

        if "lokr_w2" in values:
            self.w2 = values["lokr_w2"]
            self.w2_a = None
            self.w2_b = None
        else:
            self.w2 = None
            self.w2_a = values["lokr_w2_a"]
            self.w2_b = values["lokr_w2_b"]

        if "lokr_t2" in values:
            self.t2 = values["lokr_t2"]
        else:
            self.t2 = None

        if "lokr_w1_b" in values:
            self.rank = values["lokr_w1_b"].shape[0]
        elif "lokr_w2_b" in values:
            self.rank = values["lokr_w2_b"].shape[0]
        else:
            self.rank = None  # unscaled

    def get_weight(self, orig_weight: torch.Tensor):
        w1 = self.w1
        if w1 is None:
            w1 = self.w1_a @ self.w1_b

        w2 = self.w2
        if w2 is None:
            if self.t2 is None:
                w2 = self.w2_a @ self.w2_b
            else:
                w2 = torch.einsum("i j k l, i p, j r -> p r k l", self.t2, self.w2_a, self.w2_b)

        if len(w2.shape) == 4:
            w1 = w1.unsqueeze(2).unsqueeze(2)
        w2 = w2.contiguous()
        weight = torch.kron(w1, w2)

        return weight

    def calc_size(self) -> int:
        model_size = super().calc_size()
        for val in [self.w1, self.w1_a, self.w1_b, self.w2, self.w2_a, self.w2_b, self.t2]:
            if val is not None:
                model_size += val.nelement() * val.element_size()
        return model_size

    def to(
        self,
        device: Optional[torch.device] = None,
        dtype: Optional[torch.dtype] = None,
    ):
        super().to(device=device, dtype=dtype)

        if self.w1 is not None:
            self.w1 = self.w1.to(device=device, dtype=dtype)
        else:
            self.w1_a = self.w1_a.to(device=device, dtype=dtype)
            self.w1_b = self.w1_b.to(device=device, dtype=dtype)

        if self.w2 is not None:
            self.w2 = self.w2.to(device=device, dtype=dtype)
        else:
            self.w2_a = self.w2_a.to(device=device, dtype=dtype)
            self.w2_b = self.w2_b.to(device=device, dtype=dtype)

        if self.t2 is not None:
            self.t2 = self.t2.to(device=device, dtype=dtype)


class FullLayer(LoRALayerBase):
    # weight: torch.Tensor

    def __init__(
        self,
        layer_key: str,
        values: dict,
    ):
        super().__init__(layer_key, values)

        self.weight = values["diff"]

        if len(values.keys()) > 1:
            _keys = list(values.keys())
            _keys.remove("diff")
            raise NotImplementedError(f"Unexpected keys in lora diff layer: {_keys}")

        self.rank = None  # unscaled

    def get_weight(self, orig_weight: torch.Tensor):
        return self.weight

    def calc_size(self) -> int:
        model_size = super().calc_size()
        model_size += self.weight.nelement() * self.weight.element_size()
        return model_size

    def to(
        self,
        device: Optional[torch.device] = None,
        dtype: Optional[torch.dtype] = None,
    ):
        super().to(device=device, dtype=dtype)

        self.weight = self.weight.to(device=device, dtype=dtype)


class IA3Layer(LoRALayerBase):
    # weight: torch.Tensor
    # on_input: torch.Tensor

    def __init__(
        self,
        layer_key: str,
        values: dict,
    ):
        super().__init__(layer_key, values)

        self.weight = values["weight"]
        self.on_input = values["on_input"]

        self.rank = None  # unscaled

    def get_weight(self, orig_weight: torch.Tensor):
        weight = self.weight
        if not self.on_input:
            weight = weight.reshape(-1, 1)
        return orig_weight * weight

    def calc_size(self) -> int:
        model_size = super().calc_size()
        model_size += self.weight.nelement() * self.weight.element_size()
        model_size += self.on_input.nelement() * self.on_input.element_size()
        return model_size

    def to(
        self,
        device: Optional[torch.device] = None,
        dtype: Optional[torch.dtype] = None,
    ):
        super().to(device=device, dtype=dtype)

        self.weight = self.weight.to(device=device, dtype=dtype)
        self.on_input = self.on_input.to(device=device, dtype=dtype)


# TODO: rename all methods used in model logic with Info postfix and remove here Raw postfix
class LoRAModelRaw:  # (torch.nn.Module):
    _name: str
    layers: Dict[str, LoRALayer]
    _device: torch.device
    _dtype: torch.dtype

    def __init__(
        self,
        name: str,
        layers: Dict[str, LoRALayer],
        device: torch.device,
        dtype: torch.dtype,
    ):
        self._name = name
        self._device = device or torch.cpu
        self._dtype = dtype or torch.float32
        self.layers = layers

    @property
    def name(self):
        return self._name

    @property
    def device(self):
        return self._device

    @property
    def dtype(self):
        return self._dtype

    def to(
        self,
        device: Optional[torch.device] = None,
        dtype: Optional[torch.dtype] = None,
    ):
        # TODO: try revert if exception?
        for key, layer in self.layers.items():
            layer.to(device=device, dtype=dtype)
        self._device = device
        self._dtype = dtype

    def calc_size(self) -> int:
        model_size = 0
        for _, layer in self.layers.items():
            model_size += layer.calc_size()
        return model_size

    @classmethod
    def _convert_sdxl_keys_to_diffusers_format(cls, state_dict):
        """Convert the keys of an SDXL LoRA state_dict to diffusers format.

        The input state_dict can be in either Stability AI format or diffusers format. If the state_dict is already in
        diffusers format, then this function will have no effect.

        This function is adapted from:
        https://github.com/bmaltais/kohya_ss/blob/2accb1305979ba62f5077a23aabac23b4c37e935/networks/lora_diffusers.py#L385-L409

        Args:
            state_dict (Dict[str, Tensor]): The SDXL LoRA state_dict.

        Raises:
            ValueError: If state_dict contains an unrecognized key, or not all keys could be converted.

        Returns:
            Dict[str, Tensor]: The diffusers-format state_dict.
        """
        converted_count = 0  # The number of Stability AI keys converted to diffusers format.
        not_converted_count = 0  # The number of keys that were not converted.

        # Get a sorted list of Stability AI UNet keys so that we can efficiently search for keys with matching prefixes.
        # For example, we want to efficiently find `input_blocks_4_1` in the list when searching for
        # `input_blocks_4_1_proj_in`.
        stability_unet_keys = list(SDXL_UNET_STABILITY_TO_DIFFUSERS_MAP)
        stability_unet_keys.sort()

        new_state_dict = dict()
        for full_key, value in state_dict.items():
            if full_key.startswith("lora_unet_"):
                search_key = full_key.replace("lora_unet_", "")
                # Use bisect to find the key in stability_unet_keys that *may* match the search_key's prefix.
                position = bisect.bisect_right(stability_unet_keys, search_key)
                map_key = stability_unet_keys[position - 1]
                # Now, check if the map_key *actually* matches the search_key.
                if search_key.startswith(map_key):
                    new_key = full_key.replace(map_key, SDXL_UNET_STABILITY_TO_DIFFUSERS_MAP[map_key])
                    new_state_dict[new_key] = value
                    converted_count += 1
                else:
                    new_state_dict[full_key] = value
                    not_converted_count += 1
            elif full_key.startswith("lora_te1_") or full_key.startswith("lora_te2_"):
                # The CLIP text encoders have the same keys in both Stability AI and diffusers formats.
                new_state_dict[full_key] = value
                continue
            else:
                raise ValueError(f"Unrecognized SDXL LoRA key prefix: '{full_key}'.")

        if converted_count > 0 and not_converted_count > 0:
            raise ValueError(
                f"The SDXL LoRA could only be partially converted to diffusers format. converted={converted_count},"
                f" not_converted={not_converted_count}"
            )

        return new_state_dict

    @classmethod
    def from_checkpoint(
        cls,
        file_path: Union[str, Path],
        device: Optional[torch.device] = None,
        dtype: Optional[torch.dtype] = None,
        base_model: Optional[BaseModelType] = None,
    ):
        device = device or torch.device("cpu")
        dtype = dtype or torch.float32

        if isinstance(file_path, str):
            file_path = Path(file_path)

        model = cls(
            device=device,
            dtype=dtype,
            name=file_path.stem,  # TODO:
            layers=dict(),
        )

        if file_path.suffix == ".safetensors":
            state_dict = load_file(file_path.absolute().as_posix(), device="cpu")
        else:
            state_dict = torch.load(file_path, map_location="cpu")

        state_dict = cls._group_state(state_dict)

        if base_model == BaseModelType.StableDiffusionXL:
            state_dict = cls._convert_sdxl_keys_to_diffusers_format(state_dict)

        for layer_key, values in state_dict.items():
            # lora and locon
            if "lora_down.weight" in values:
                layer = LoRALayer(layer_key, values)

            # loha
            elif "hada_w1_b" in values:
                layer = LoHALayer(layer_key, values)

            # lokr
            elif "lokr_w1_b" in values or "lokr_w1" in values:
                layer = LoKRLayer(layer_key, values)

            # diff
            elif "diff" in values:
                layer = FullLayer(layer_key, values)

            # ia3
            elif "weight" in values and "on_input" in values:
                layer = IA3Layer(layer_key, values)

            else:
                print(f">> Encountered unknown lora layer module in {model.name}: {layer_key} - {list(values.keys())}")
                raise Exception("Unknown lora format!")

            # lower memory consumption by removing already parsed layer values
            state_dict[layer_key].clear()

            layer.to(device=device, dtype=dtype)
            model.layers[layer_key] = layer

        return model

    @staticmethod
    def _group_state(state_dict: dict):
        state_dict_groupped = dict()

        for key, value in state_dict.items():
            stem, leaf = key.split(".", 1)
            if stem not in state_dict_groupped:
                state_dict_groupped[stem] = dict()
            state_dict_groupped[stem][leaf] = value

        return state_dict_groupped


# code from
# https://github.com/bmaltais/kohya_ss/blob/2accb1305979ba62f5077a23aabac23b4c37e935/networks/lora_diffusers.py#L15C1-L97C32
def make_sdxl_unet_conversion_map():
    """Create a dict mapping state_dict keys from Stability AI SDXL format to diffusers SDXL format."""
    unet_conversion_map_layer = []

    for i in range(3):  # num_blocks is 3 in sdxl
        # loop over downblocks/upblocks
        for j in range(2):
            # loop over resnets/attentions for downblocks
            hf_down_res_prefix = f"down_blocks.{i}.resnets.{j}."
            sd_down_res_prefix = f"input_blocks.{3*i + j + 1}.0."
            unet_conversion_map_layer.append((sd_down_res_prefix, hf_down_res_prefix))

            if i < 3:
                # no attention layers in down_blocks.3
                hf_down_atn_prefix = f"down_blocks.{i}.attentions.{j}."
                sd_down_atn_prefix = f"input_blocks.{3*i + j + 1}.1."
                unet_conversion_map_layer.append((sd_down_atn_prefix, hf_down_atn_prefix))

        for j in range(3):
            # loop over resnets/attentions for upblocks
            hf_up_res_prefix = f"up_blocks.{i}.resnets.{j}."
            sd_up_res_prefix = f"output_blocks.{3*i + j}.0."
            unet_conversion_map_layer.append((sd_up_res_prefix, hf_up_res_prefix))

            # if i > 0: commentout for sdxl
            # no attention layers in up_blocks.0
            hf_up_atn_prefix = f"up_blocks.{i}.attentions.{j}."
            sd_up_atn_prefix = f"output_blocks.{3*i + j}.1."
            unet_conversion_map_layer.append((sd_up_atn_prefix, hf_up_atn_prefix))

        if i < 3:
            # no downsample in down_blocks.3
            hf_downsample_prefix = f"down_blocks.{i}.downsamplers.0.conv."
            sd_downsample_prefix = f"input_blocks.{3*(i+1)}.0.op."
            unet_conversion_map_layer.append((sd_downsample_prefix, hf_downsample_prefix))

            # no upsample in up_blocks.3
            hf_upsample_prefix = f"up_blocks.{i}.upsamplers.0."
            sd_upsample_prefix = f"output_blocks.{3*i + 2}.{2}."  # change for sdxl
            unet_conversion_map_layer.append((sd_upsample_prefix, hf_upsample_prefix))

    hf_mid_atn_prefix = "mid_block.attentions.0."
    sd_mid_atn_prefix = "middle_block.1."
    unet_conversion_map_layer.append((sd_mid_atn_prefix, hf_mid_atn_prefix))

    for j in range(2):
        hf_mid_res_prefix = f"mid_block.resnets.{j}."
        sd_mid_res_prefix = f"middle_block.{2*j}."
        unet_conversion_map_layer.append((sd_mid_res_prefix, hf_mid_res_prefix))

    unet_conversion_map_resnet = [
        # (stable-diffusion, HF Diffusers)
        ("in_layers.0.", "norm1."),
        ("in_layers.2.", "conv1."),
        ("out_layers.0.", "norm2."),
        ("out_layers.3.", "conv2."),
        ("emb_layers.1.", "time_emb_proj."),
        ("skip_connection.", "conv_shortcut."),
    ]

    unet_conversion_map = []
    for sd, hf in unet_conversion_map_layer:
        if "resnets" in hf:
            for sd_res, hf_res in unet_conversion_map_resnet:
                unet_conversion_map.append((sd + sd_res, hf + hf_res))
        else:
            unet_conversion_map.append((sd, hf))

    for j in range(2):
        hf_time_embed_prefix = f"time_embedding.linear_{j+1}."
        sd_time_embed_prefix = f"time_embed.{j*2}."
        unet_conversion_map.append((sd_time_embed_prefix, hf_time_embed_prefix))

    for j in range(2):
        hf_label_embed_prefix = f"add_embedding.linear_{j+1}."
        sd_label_embed_prefix = f"label_emb.0.{j*2}."
        unet_conversion_map.append((sd_label_embed_prefix, hf_label_embed_prefix))

    unet_conversion_map.append(("input_blocks.0.0.", "conv_in."))
    unet_conversion_map.append(("out.0.", "conv_norm_out."))
    unet_conversion_map.append(("out.2.", "conv_out."))

    return unet_conversion_map


SDXL_UNET_STABILITY_TO_DIFFUSERS_MAP = {
    sd.rstrip(".").replace(".", "_"): hf.rstrip(".").replace(".", "_") for sd, hf in make_sdxl_unet_conversion_map()
}
