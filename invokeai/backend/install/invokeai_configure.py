#!/usr/bin/env python
# Copyright (c) 2022 Lincoln D. Stein (https://github.com/lstein)
# Before running stable-diffusion on an internet-isolated machine,
# run this script from one with internet connectivity. The
# two machines must share a common .cache directory.
#
# Coauthor: Kevin Turner http://github.com/keturn
#
import sys
import argparse
import io
import os
import shutil
import textwrap
import traceback
import warnings
import yaml
from argparse import Namespace
from pathlib import Path
from shutil import get_terminal_size
from typing import get_type_hints
from urllib import request

import npyscreen
import transformers
from diffusers import AutoencoderKL
from diffusers.pipelines.stable_diffusion.safety_checker import StableDiffusionSafetyChecker
from huggingface_hub import HfFolder
from huggingface_hub import login as hf_hub_login
from omegaconf import OmegaConf
from tqdm import tqdm
from transformers import (
    CLIPTextModel,
    CLIPTokenizer,
    AutoFeatureExtractor,
    BertTokenizerFast,
)
import invokeai.configs as configs

from invokeai.app.services.config import (
    InvokeAIAppConfig,
)
from invokeai.backend.util.logging import InvokeAILogger
from invokeai.frontend.install.model_install import addModelsForm, process_and_execute
from invokeai.frontend.install.widgets import (
    CenteredButtonPress,
    IntTitleSlider,
    set_min_terminal_size,
    CyclingForm,
    MIN_COLS,
    MIN_LINES,
)
from invokeai.backend.install.legacy_arg_parsing import legacy_parser
from invokeai.backend.install.model_install_backend import (
    hf_download_from_pretrained,
    InstallSelections,
    ModelInstall,
)
from invokeai.backend.model_management.model_probe import (
    ModelType, BaseModelType
    )

warnings.filterwarnings("ignore")
transformers.logging.set_verbosity_error()


# --------------------------globals-----------------------

config = InvokeAIAppConfig.get_config()

Model_dir = "models"

Default_config_file = config.model_conf_path
SD_Configs = config.legacy_conf_path

PRECISION_CHOICES = ['auto','float16','float32']

INIT_FILE_PREAMBLE = """# InvokeAI initialization file
# This is the InvokeAI initialization file, which contains command-line default values.
# Feel free to edit. If anything goes wrong, you can re-initialize this file by deleting
# or renaming it and then running invokeai-configure again.
"""

logger=InvokeAILogger.getLogger()

# --------------------------------------------
def postscript(errors: None):
    if not any(errors):
        message = f"""
** INVOKEAI INSTALLATION SUCCESSFUL **
If you installed manually from source or with 'pip install': activate the virtual environment
then run one of the following commands to start InvokeAI.

Web UI:
   invokeai-web

Command-line client:
   invokeai

If you installed using an installation script, run:
  {config.root_path}/invoke.{"bat" if sys.platform == "win32" else "sh"}

Add the '--help' argument to see all of the command-line switches available for use.
"""

    else:
        message = "\n** There were errors during installation. It is possible some of the models were not fully downloaded.\n"
        for err in errors:
            message += f"\t - {err}\n"
        message += "Please check the logs above and correct any issues."

    print(message)


# ---------------------------------------------
def yes_or_no(prompt: str, default_yes=True):
    default = "y" if default_yes else "n"
    response = input(f"{prompt} [{default}] ") or default
    if default_yes:
        return response[0] not in ("n", "N")
    else:
        return response[0] in ("y", "Y")


# ---------------------------------------------
def HfLogin(access_token) -> str:
    """
    Helper for logging in to Huggingface
    The stdout capture is needed to hide the irrelevant "git credential helper" warning
    """

    capture = io.StringIO()
    sys.stdout = capture
    try:
        hf_hub_login(token=access_token, add_to_git_credential=False)
        sys.stdout = sys.__stdout__
    except Exception as exc:
        sys.stdout = sys.__stdout__
        print(exc)
        raise exc


# -------------------------------------
class ProgressBar:
    def __init__(self, model_name="file"):
        self.pbar = None
        self.name = model_name

    def __call__(self, block_num, block_size, total_size):
        if not self.pbar:
            self.pbar = tqdm(
                desc=self.name,
                initial=0,
                unit="iB",
                unit_scale=True,
                unit_divisor=1000,
                total=total_size,
            )
        self.pbar.update(block_size)


# ---------------------------------------------
def download_with_progress_bar(model_url: str, model_dest: str, label: str = "the"):
    try:
        logger.info(f"Installing {label} model file {model_url}...")
        if not os.path.exists(model_dest):
            os.makedirs(os.path.dirname(model_dest), exist_ok=True)
            request.urlretrieve(
                model_url, model_dest, ProgressBar(os.path.basename(model_dest))
            )
            logger.info("...downloaded successfully")
        else:
            logger.info("...exists")
    except Exception:
        logger.info("...download failed")
        logger.info(f"Error downloading {label} model")
        print(traceback.format_exc(), file=sys.stderr)


def download_conversion_models():
    target_dir = config.root_path / 'models/core/convert'
    kwargs = dict()  # for future use
    try:
        logger.info('Downloading core tokenizers and text encoders')

        # bert
        with warnings.catch_warnings():
            warnings.filterwarnings("ignore", category=DeprecationWarning)
            bert = BertTokenizerFast.from_pretrained("bert-base-uncased", **kwargs)
            bert.save_pretrained(target_dir / 'bert-base-uncased', safe_serialization=True)
        
        # sd-1
        repo_id = 'openai/clip-vit-large-patch14'
        hf_download_from_pretrained(CLIPTokenizer, repo_id, target_dir / 'clip-vit-large-patch14')
        hf_download_from_pretrained(CLIPTextModel, repo_id, target_dir / 'clip-vit-large-patch14')

        # sd-2
        repo_id = "stabilityai/stable-diffusion-2"
        pipeline = CLIPTokenizer.from_pretrained(repo_id, subfolder="tokenizer", **kwargs)
        pipeline.save_pretrained(target_dir / 'stable-diffusion-2-clip' / 'tokenizer', safe_serialization=True)

        pipeline = CLIPTextModel.from_pretrained(repo_id, subfolder="text_encoder", **kwargs)
        pipeline.save_pretrained(target_dir / 'stable-diffusion-2-clip' / 'text_encoder', safe_serialization=True)

        # VAE
        logger.info('Downloading stable diffusion VAE')
        vae = AutoencoderKL.from_pretrained('stabilityai/sd-vae-ft-mse', **kwargs)
        vae.save_pretrained(target_dir / 'sd-vae-ft-mse', safe_serialization=True)

        # safety checking
        logger.info('Downloading safety checker')
        repo_id = "CompVis/stable-diffusion-safety-checker"
        pipeline = AutoFeatureExtractor.from_pretrained(repo_id,**kwargs)
        pipeline.save_pretrained(target_dir / 'stable-diffusion-safety-checker', safe_serialization=True)

        pipeline = StableDiffusionSafetyChecker.from_pretrained(repo_id,**kwargs)
        pipeline.save_pretrained(target_dir / 'stable-diffusion-safety-checker', safe_serialization=True)
    except KeyboardInterrupt:
        raise
    except Exception as e:
        logger.error(str(e))

# ---------------------------------------------
def download_realesrgan():
    logger.info("Installing ESRGAN Upscaling models...")
    URLs = [
        dict(
            url = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.0/RealESRGAN_x4plus.pth",
            dest = "core/upscaling/realesrgan/RealESRGAN_x4plus.pth",
            description = "RealESRGAN_x4plus.pth",
        ),
        dict(
            url = "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth",
            dest = "core/upscaling/realesrgan/RealESRGAN_x4plus_anime_6B.pth",
            description = "RealESRGAN_x4plus_anime_6B.pth",
        ),
        dict(
            url= "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.1.1/ESRGAN_SRx4_DF2KOST_official-ff704c30.pth",
            dest= "core/upscaling/realesrgan/ESRGAN_SRx4_DF2KOST_official-ff704c30.pth",
            description = "ESRGAN_SRx4_DF2KOST_official.pth",
        ),
        dict(
            url= "https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.1/RealESRGAN_x2plus.pth",
            dest= "core/upscaling/realesrgan/RealESRGAN_x2plus.pth",
            description = "RealESRGAN_x2plus.pth",
        ),
    ]
    for model in URLs:
        download_with_progress_bar(model['url'], config.models_path / model['dest'], model['description'])

# ---------------------------------------------
def download_support_models():
    download_realesrgan()
    download_conversion_models()

# -------------------------------------
def get_root(root: str = None) -> str:
    if root:
        return root
    elif os.environ.get("INVOKEAI_ROOT"):
        return os.environ.get("INVOKEAI_ROOT")
    else:
        return str(config.root_path)

# -------------------------------------
class editOptsForm(CyclingForm, npyscreen.FormMultiPage):
    # for responsive resizing - disabled
    # FIX_MINIMUM_SIZE_WHEN_CREATED = False

    def create(self):
        program_opts = self.parentApp.program_opts
        old_opts = self.parentApp.invokeai_opts
        first_time = not (config.root_path / 'invokeai.yaml').exists()
        access_token = HfFolder.get_token()
        window_width, window_height = get_terminal_size()
        label = """Configure startup settings. You can come back and change these later. 
Use ctrl-N and ctrl-P to move to the <N>ext and <P>revious fields.
Use cursor arrows to make a checkbox selection, and space to toggle.
"""
        for i in textwrap.wrap(label,width=window_width-6):
            self.add_widget_intelligent(
                npyscreen.FixedText,
                value=i,
                editable=False,
                color="CONTROL",
            )

        self.nextrely += 1
        self.add_widget_intelligent(
            npyscreen.TitleFixedText,
            name="== BASIC OPTIONS ==",
            begin_entry_at=0,
            editable=False,
            color="CONTROL",
            scroll_exit=True,
        )
        self.nextrely -= 1
        self.add_widget_intelligent(
            npyscreen.FixedText,
            value="Select an output directory for images:",
            editable=False,
            color="CONTROL",
        )
        self.outdir = self.add_widget_intelligent(
            npyscreen.TitleFilename,
            name="(<tab> autocompletes, ctrl-N advances):",
            value=str(default_output_dir()),
            select_dir=True,
            must_exist=False,
            use_two_lines=False,
            labelColor="GOOD",
            begin_entry_at=40,
            scroll_exit=True,
        )
        self.nextrely += 1
        self.add_widget_intelligent(
            npyscreen.FixedText,
            value="Activate the NSFW checker to blur images showing potential sexual imagery:",
            editable=False,
            color="CONTROL",
        )
        self.nsfw_checker = self.add_widget_intelligent(
            npyscreen.Checkbox,
            name="NSFW checker",
            value=old_opts.nsfw_checker,
            relx=5,
            scroll_exit=True,
        )
        self.nextrely += 1
        label = """HuggingFace access token (OPTIONAL) for automatic model downloads. See https://huggingface.co/settings/tokens."""
        for line in textwrap.wrap(label,width=window_width-6):
            self.add_widget_intelligent(
                npyscreen.FixedText,
                value=line,
                editable=False,
                color="CONTROL",
            )

        self.hf_token = self.add_widget_intelligent(
            npyscreen.TitlePassword,
            name="Access Token (ctrl-shift-V pastes):",
            value=access_token,
            begin_entry_at=42,
            use_two_lines=False,
            scroll_exit=True,
        )
        self.nextrely += 1
        self.add_widget_intelligent(
            npyscreen.TitleFixedText,
            name="== ADVANCED OPTIONS ==",
            begin_entry_at=0,
            editable=False,
            color="CONTROL",
            scroll_exit=True,
        )
        self.nextrely -= 1
        self.add_widget_intelligent(
            npyscreen.TitleFixedText,
            name="GPU Management",
            begin_entry_at=0,
            editable=False,
            color="CONTROL",
            scroll_exit=True,
        )
        self.nextrely -= 1
        self.free_gpu_mem = self.add_widget_intelligent(
            npyscreen.Checkbox,
            name="Free GPU memory after each generation",
            value=old_opts.free_gpu_mem,
            relx=5,
            scroll_exit=True,
        )
        self.xformers_enabled = self.add_widget_intelligent(
            npyscreen.Checkbox,
            name="Enable xformers support if available",
            value=old_opts.xformers_enabled,
            relx=5,
            scroll_exit=True,
        )
        self.always_use_cpu = self.add_widget_intelligent(
            npyscreen.Checkbox,
            name="Force CPU to be used on GPU systems",
            value=old_opts.always_use_cpu,
            relx=5,
            scroll_exit=True,
        )
        precision = old_opts.precision or (
            "float32" if program_opts.full_precision else "auto"
        )
        self.precision = self.add_widget_intelligent(
            npyscreen.TitleSelectOne,
            columns = 2,
            name="Precision",
            values=PRECISION_CHOICES,
            value=PRECISION_CHOICES.index(precision),
            begin_entry_at=3,
            max_height=len(PRECISION_CHOICES) + 1,
            scroll_exit=True,
        )
        self.max_cache_size = self.add_widget_intelligent(
            IntTitleSlider,
            name="Size of the RAM cache used for fast model switching (GB)",
            value=old_opts.max_cache_size,
            out_of=20,
            lowest=3,
            begin_entry_at=6,
            scroll_exit=True,
        )
        self.nextrely += 1
        self.add_widget_intelligent(
            npyscreen.FixedText,
            value="Directories containing textual inversion, controlnet and LoRA models (<tab> autocompletes, ctrl-N advances):",
            editable=False,
            color="CONTROL",
        )
        self.autoimport_dirs = {}
        for description, config_name, path in autoimport_paths(old_opts):
            self.autoimport_dirs[config_name] = self.add_widget_intelligent(
                npyscreen.TitleFilename,
                name=description+':',
                value=str(path),
                select_dir=True,
                must_exist=False,
                use_two_lines=False,
                labelColor="GOOD",
                begin_entry_at=32,
                scroll_exit=True
            )
        self.nextrely += 1
        self.add_widget_intelligent(
            npyscreen.TitleFixedText,
            name="== LICENSE ==",
            begin_entry_at=0,
            editable=False,
            color="CONTROL",
            scroll_exit=True,
        )
        self.nextrely -= 1
        label = """BY DOWNLOADING THE STABLE DIFFUSION WEIGHT FILES, YOU AGREE TO HAVE READ
AND ACCEPTED THE CREATIVEML RESPONSIBLE AI LICENSE LOCATED AT
https://huggingface.co/spaces/CompVis/stable-diffusion-license
"""
        for i in textwrap.wrap(label,width=window_width-6):
            self.add_widget_intelligent(
                npyscreen.FixedText,
                value=i,
                editable=False,
                color="CONTROL",
            )
        self.license_acceptance = self.add_widget_intelligent(
            npyscreen.Checkbox,
            name="I accept the CreativeML Responsible AI License",
            value=not first_time,
            relx=2,
            scroll_exit=True,
        )
        self.nextrely += 1
        label = (
            "DONE"
            if program_opts.skip_sd_weights or program_opts.default_only
            else "NEXT"
        )
        self.ok_button = self.add_widget_intelligent(
            CenteredButtonPress,
            name=label,
            relx=(window_width - len(label)) // 2,
            rely=-3,
            when_pressed_function=self.on_ok,
        )

    def on_ok(self):
        options = self.marshall_arguments()
        if self.validate_field_values(options):
            self.parentApp.new_opts = options
            if hasattr(self.parentApp, "model_select"):
                self.parentApp.setNextForm("MODELS")
            else:
                self.parentApp.setNextForm(None)
            self.editing = False
        else:
            self.editing = True
            
    def validate_field_values(self, opt: Namespace) -> bool:
        bad_fields = []
        if not opt.license_acceptance:
            bad_fields.append(
                "Please accept the license terms before proceeding to model downloads"
            )
        if not Path(opt.outdir).parent.exists():
            bad_fields.append(
                f"The output directory does not seem to be valid. Please check that {str(Path(opt.outdir).parent)} is an existing directory."
            )
        if len(bad_fields) > 0:
            message = "The following problems were detected and must be corrected:\n"
            for problem in bad_fields:
                message += f"* {problem}\n"
            npyscreen.notify_confirm(message)
            return False
        else:
            return True

    def marshall_arguments(self):
        new_opts = Namespace()

        for attr in [
                "outdir",
                "nsfw_checker",
                "free_gpu_mem",
                "max_cache_size",
                "xformers_enabled",
                "always_use_cpu",
        ]:
            setattr(new_opts, attr, getattr(self, attr).value)

        for attr in self.autoimport_dirs:
            directory = Path(self.autoimport_dirs[attr].value)
            if directory.is_relative_to(config.root_path):
                directory = directory.relative_to(config.root_path)
            setattr(new_opts, attr, directory)

        new_opts.hf_token = self.hf_token.value
        new_opts.license_acceptance = self.license_acceptance.value
        new_opts.precision = PRECISION_CHOICES[self.precision.value[0]]
        
        return new_opts


class EditOptApplication(npyscreen.NPSAppManaged):
    def __init__(self, program_opts: Namespace, invokeai_opts: Namespace):
        super().__init__()
        self.program_opts = program_opts
        self.invokeai_opts = invokeai_opts
        self.user_cancelled = False
        self.autoload_pending = True
        self.install_selections = default_user_selections(program_opts)

    def onStart(self):
        npyscreen.setTheme(npyscreen.Themes.DefaultTheme)
        self.options = self.addForm(
            "MAIN",
            editOptsForm,
            name="InvokeAI Startup Options",
            cycle_widgets=True,
        )
        if not (self.program_opts.skip_sd_weights or self.program_opts.default_only):
            self.model_select = self.addForm(
                "MODELS",
                addModelsForm,
                name="Install Stable Diffusion Models",
                multipage=True,
                cycle_widgets=True,
            )

    def new_opts(self):
        return self.options.marshall_arguments()


def edit_opts(program_opts: Namespace, invokeai_opts: Namespace) -> argparse.Namespace:
    editApp = EditOptApplication(program_opts, invokeai_opts)
    editApp.run()
    return editApp.new_opts()


def default_startup_options(init_file: Path) -> Namespace:
    opts = InvokeAIAppConfig.get_config()
    if not init_file.exists():
        opts.nsfw_checker = True
    return opts

def default_user_selections(program_opts: Namespace) -> InstallSelections:
    installer = ModelInstall(config)
    models = installer.all_models()
    return InstallSelections(
        install_models=[models[installer.default_model()].path or models[installer.default_model()].repo_id]
        if program_opts.default_only
        else [models[x].path or models[x].repo_id for x in installer.recommended_models()]
        if program_opts.yes_to_all
        else list(),
#        scan_directory=None,
#        autoscan_on_startup=None,
    )

# -------------------------------------
def autoimport_paths(config: InvokeAIAppConfig):
    return [
        ('Checkpoints & diffusers models', 'autoimport_dir', config.root_path / config.autoimport_dir),
        ('LoRA/LyCORIS models',            'lora_dir',       config.root_path / config.lora_dir),
        ('Controlnet models',              'controlnet_dir', config.root_path / config.controlnet_dir),
        ('Textual Inversion Embeddings',   'embedding_dir',  config.root_path / config.embedding_dir),
    ]
    
# -------------------------------------
def initialize_rootdir(root: Path, yes_to_all: bool = False):
    logger.info("** INITIALIZING INVOKEAI RUNTIME DIRECTORY **")
    for name in (
            "models",
            "databases",
            "text-inversion-output",
            "text-inversion-training-data",
            "configs"
    ):
        os.makedirs(os.path.join(root, name), exist_ok=True)
    for model_type in ModelType:
        Path(root, 'autoimport', model_type.value).mkdir(parents=True, exist_ok=True)

    configs_src = Path(configs.__path__[0])
    configs_dest = root / "configs"
    if not os.path.samefile(configs_src, configs_dest):
        shutil.copytree(configs_src, configs_dest, dirs_exist_ok=True)

    dest = root / 'models'
    for model_base in BaseModelType:
        for model_type in ModelType:
            path = dest / model_base.value / model_type.value
            path.mkdir(parents=True, exist_ok=True)
    path = dest / 'core'
    path.mkdir(parents=True, exist_ok=True)

    with open(root / 'configs' / 'models.yaml','w') as yaml_file:
        yaml_file.write(yaml.dump({'__metadata__':
                                   {'version':'3.0.0'}
                                   }
                                  )
                        )
        
# -------------------------------------
def run_console_ui(
    program_opts: Namespace, initfile: Path = None
) -> (Namespace, Namespace):
    # parse_args() will read from init file if present
    invokeai_opts = default_startup_options(initfile)
    invokeai_opts.root = program_opts.root

    # The third argument is needed in the Windows 11 environment to
    # launch a console window running this program.
    set_min_terminal_size(MIN_COLS, MIN_LINES)

    # the install-models application spawns a subprocess to install
    # models, and will crash unless this is set before running.
    import torch
    torch.multiprocessing.set_start_method("spawn")
    
    editApp = EditOptApplication(program_opts, invokeai_opts)
    editApp.run()
    if editApp.user_cancelled:
        return (None, None)
    else:
        return (editApp.new_opts, editApp.install_selections)


# -------------------------------------
def write_opts(opts: Namespace, init_file: Path):
    """
    Update the invokeai.yaml file with values from current settings.
    """
    # this will load current settings
    new_config = InvokeAIAppConfig.get_config()
    new_config.root = config.root
    
    for key,value in opts.__dict__.items():
        if hasattr(new_config,key):
            setattr(new_config,key,value)

    with open(init_file,'w', encoding='utf-8') as file:
        file.write(new_config.to_yaml())

# -------------------------------------
def default_output_dir() -> Path:
    return config.root_path / "outputs"

# -------------------------------------
def write_default_options(program_opts: Namespace, initfile: Path):
    opt = default_startup_options(initfile)
    write_opts(opt, initfile)

# -------------------------------------
# Here we bring in
# the legacy Args object in order to parse
# the old init file and write out the new
# yaml format.
def migrate_init_file(legacy_format:Path):
    old = legacy_parser.parse_args([f'@{str(legacy_format)}'])
    new = InvokeAIAppConfig.get_config()

    fields = list(get_type_hints(InvokeAIAppConfig).keys())
    for attr in fields:
        if hasattr(old,attr):
            setattr(new,attr,getattr(old,attr))

    # a few places where the field names have changed and we have to
    # manually add in the new names/values
    new.nsfw_checker = old.safety_checker
    new.xformers_enabled = old.xformers
    new.conf_path = old.conf
    new.root = legacy_format.parent.resolve()

    invokeai_yaml = legacy_format.parent / 'invokeai.yaml'
    with open(invokeai_yaml,"w", encoding="utf-8") as outfile:
        outfile.write(new.to_yaml())

    legacy_format.replace(legacy_format.parent / 'invokeai.init.orig')

# -------------------------------------
def migrate_models(root: Path):
    from invokeai.backend.install.migrate_to_3 import do_migrate
    do_migrate(root, root)

def migrate_if_needed(opt: Namespace, root: Path)->bool:
    # We check for to see if the runtime directory is correctly initialized.
    old_init_file = root / 'invokeai.init'
    new_init_file = root / 'invokeai.yaml'
    old_hub = root / 'models/hub'
    migration_needed =  (old_init_file.exists() and not new_init_file.exists()) and old_hub.exists()
    
    if migration_needed:
        if opt.yes_to_all or \
            yes_or_no(f'{str(config.root_path)} appears to be a 2.3 format root directory. Convert to version 3.0?'):

            logger.info('** Migrating invokeai.init to invokeai.yaml')
            migrate_init_file(old_init_file)
            config.parse_args(argv=[],conf=OmegaConf.load(new_init_file))

            if old_hub.exists():
                migrate_models(config.root_path)
        else:
            print('Cannot continue without conversion. Aborting.')
    
    return migration_needed

    
# -------------------------------------
def main():
    parser = argparse.ArgumentParser(description="InvokeAI model downloader")
    parser.add_argument(
        "--skip-sd-weights",
        dest="skip_sd_weights",
        action=argparse.BooleanOptionalAction,
        default=False,
        help="skip downloading the large Stable Diffusion weight files",
    )
    parser.add_argument(
        "--skip-support-models",
        dest="skip_support_models",
        action=argparse.BooleanOptionalAction,
        default=False,
        help="skip downloading the support models",
    )
    parser.add_argument(
        "--full-precision",
        dest="full_precision",
        action=argparse.BooleanOptionalAction,
        type=bool,
        default=False,
        help="use 32-bit weights instead of faster 16-bit weights",
    )
    parser.add_argument(
        "--yes",
        "-y",
        dest="yes_to_all",
        action="store_true",
        help='answer "yes" to all prompts',
    )
    parser.add_argument(
        "--default_only",
        action="store_true",
        help="when --yes specified, only install the default model",
    )
    parser.add_argument(
        "--config_file",
        "-c",
        dest="config_file",
        type=str,
        default=None,
        help="path to configuration file to create",
    )
    parser.add_argument(
        "--root_dir",
        dest="root",
        type=str,
        default=None,
        help="path to root of install directory",
    )
    opt = parser.parse_args()

    invoke_args = []
    if opt.root:
        invoke_args.extend(['--root',opt.root])
    if opt.full_precision:
        invoke_args.extend(['--precision','float32'])
    config.parse_args(invoke_args)
    logger = InvokeAILogger().getLogger(config=config)

    errors = set()

    try:
        # if we do a root migration/upgrade, then we are keeping previous
        # configuration and we are done.
        if migrate_if_needed(opt, config.root_path):
            sys.exit(0)

        if not config.model_conf_path.exists():
            initialize_rootdir(config.root_path, opt.yes_to_all)

        models_to_download = default_user_selections(opt)
        new_init_file = config.root_path / 'invokeai.yaml'
        if opt.yes_to_all:
            write_default_options(opt, new_init_file)
            init_options = Namespace(
                precision="float32" if opt.full_precision else "float16"
            )
        else:
            init_options, models_to_download = run_console_ui(opt, new_init_file)
            if init_options:
                write_opts(init_options, new_init_file)
            else:
                logger.info(
                    '\n** CANCELLED AT USER\'S REQUEST. USE THE "invoke.sh" LAUNCHER TO RUN LATER **\n'
                )
                sys.exit(0)
                
        if opt.skip_support_models:
            logger.info("SKIPPING SUPPORT MODEL DOWNLOADS PER USER REQUEST")
        else:
            logger.info("CHECKING/UPDATING SUPPORT MODELS")
            download_support_models()

        if opt.skip_sd_weights:
            logger.warning("SKIPPING DIFFUSION WEIGHTS DOWNLOAD PER USER REQUEST")
        elif models_to_download:
            logger.info("DOWNLOADING DIFFUSION WEIGHTS")
            process_and_execute(opt, models_to_download)

        postscript(errors=errors)
        if not opt.yes_to_all:
            input('Press any key to continue...')
    except KeyboardInterrupt:
        print("\nGoodbye! Come back soon.")


# -------------------------------------
if __name__ == "__main__":
    main()
