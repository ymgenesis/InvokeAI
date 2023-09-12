"""
Minimalist updater script. Prompts user for the tag or branch to update to and runs
pip install <path_to_git_source>.
"""
import os
import platform

import pkg_resources
import psutil
import requests
from rich import box, print
from rich.console import Console, group
from rich.panel import Panel
from rich.prompt import Prompt
from rich.style import Style

from invokeai.version import __version__

INVOKE_AI_SRC = "https://github.com/invoke-ai/InvokeAI/archive"
INVOKE_AI_TAG = "https://github.com/invoke-ai/InvokeAI/archive/refs/tags"
INVOKE_AI_BRANCH = "https://github.com/invoke-ai/InvokeAI/archive/refs/heads"
INVOKE_AI_REL = "https://api.github.com/repos/invoke-ai/InvokeAI/releases"

OS = platform.uname().system
ARCH = platform.uname().machine

if OS == "Windows":
    # Windows terminals look better without a background colour
    console = Console(style=Style(color="grey74"))
else:
    console = Console(style=Style(color="grey74", bgcolor="grey19"))


def get_versions() -> dict:
    return requests.get(url=INVOKE_AI_REL).json()


def invokeai_is_running() -> bool:
    for p in psutil.process_iter():
        try:
            cmdline = p.cmdline()
            matches = [x for x in cmdline if x.endswith(("invokeai", "invokeai.exe"))]
            if matches:
                print(
                    f":exclamation: [bold red]An InvokeAI instance appears to be running as process {p.pid}[/red bold]"
                )
                return True
        except (psutil.AccessDenied, psutil.NoSuchProcess):
            continue
    return False


def welcome(versions: dict):
    @group()
    def text():
        yield f"InvokeAI Version: [bold yellow]{__version__}"
        yield ""
        yield "This script will update InvokeAI to the latest release, or to the development version of your choice."
        yield ""
        yield "When updating to an arbitrary tag or branch, be aware that the front end may be mismatched to the backend,"
        yield "making the web frontend unusable. Please downgrade to the latest release if this happens."
        yield ""
        yield "[bold yellow]Options:"
        yield f"""[1] Update to the latest official release ([italic]{versions[0]['tag_name']}[/italic])
[2] Manually enter the [bold]tag name[/bold] for the version you wish to update to
[3] Manually enter the [bold]branch name[/bold] for the version you wish to update to"""

    console.rule()
    print(
        Panel(
            title="[bold wheat1]InvokeAI Updater",
            renderable=text(),
            box=box.DOUBLE,
            expand=True,
            padding=(1, 2),
            style=Style(bgcolor="grey23", color="orange1"),
            subtitle=f"[bold grey39]{OS}-{ARCH}",
        )
    )
    console.line()


def get_extras():
    extras = ""
    try:
        _ = pkg_resources.get_distribution("xformers")
        extras = "[xformers]"
    except pkg_resources.DistributionNotFound:
        pass
    return extras


def main():
    versions = get_versions()
    if invokeai_is_running():
        print(":exclamation: [bold red]Please terminate all running instances of InvokeAI before updating.[/red bold]")
        input("Press any key to continue...")
        return

    welcome(versions)

    tag = None
    branch = None
    release = None
    choice = Prompt.ask("Choice:", choices=["1", "2", "3", "4"], default="1")

    if choice == "1":
        release = versions[0]["tag_name"]
    elif choice == "2":
        while not tag:
            tag = Prompt.ask("Enter an InvokeAI tag name")
    elif choice == "3":
        while not branch:
            branch = Prompt.ask("Enter an InvokeAI branch name")

    extras = get_extras()

    print(f":crossed_fingers: Upgrading to [yellow]{tag or release or branch}[/yellow]")
    if release:
        cmd = f'pip install "invokeai{extras} @ {INVOKE_AI_SRC}/{release}.zip" --use-pep517 --upgrade'
    elif tag:
        cmd = f'pip install "invokeai{extras} @ {INVOKE_AI_TAG}/{tag}.zip" --use-pep517 --upgrade'
    else:
        cmd = f'pip install "invokeai{extras} @ {INVOKE_AI_BRANCH}/{branch}.zip" --use-pep517 --upgrade'
    print("")
    print("")
    if os.system(cmd) == 0:
        print(":heavy_check_mark: Upgrade successful")
    else:
        print(":exclamation: [bold red]Upgrade failed[/red bold]")


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        pass
