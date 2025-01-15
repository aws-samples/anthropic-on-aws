import asyncio
import base64
import os
import shlex
import shutil
from enum import StrEnum
from pathlib import Path
from typing import Literal, TypedDict
from uuid import uuid4

from .base import BaseAnthropicTool, ComputerToolOptions, ToolError, ToolResult
from .run import run

WIDTH = int(os.getenv("WIDTH") or 0)
HEIGHT = int(os.getenv("HEIGHT") or 0)
assert WIDTH and HEIGHT, "WIDTH, HEIGHT must be set"
if not (display_num := os.getenv("DISPLAY_NUM")):
    raise RuntimeError("DISPLAY_NUM must be set")
DISPLAY_NUM = int(display_num)

OUTPUT_DIR = "/tmp/outputs"

TYPING_DELAY_MS = 12
TYPING_GROUP_SIZE = 50

Action = Literal[
    "key",
    "type",
    "mouse_move",
    "left_click",
    "left_click_drag",
    "right_click",
    "middle_click",
    "double_click",
    "screenshot",
    "cursor_position",
]


class Resolution(TypedDict):
    width: int
    height: int


# sizes above XGA/WXGA are not recommended (see README.md)
# scale down to one of these targets if ComputerTool._scaling_enabled is set
MAX_SCALING_TARGETS: dict[str, Resolution] = {
    "XGA": Resolution(width=1024, height=768),  # 4:3
    "WXGA": Resolution(width=1280, height=800),  # 16:10
    "FWXGA": Resolution(width=1366, height=768),  # ~16:9
}


class ScalingSource(StrEnum):
    COMPUTER = "computer"
    API = "api"


def chunks(s: str, chunk_size: int) -> list[str]:
    return [s[i : i + chunk_size] for i in range(0, len(s), chunk_size)]


class ComputerTool(BaseAnthropicTool):
    """
    A tool that allows the agent to interact with the screen, keyboard, and mouse of the current computer.
    The tool parameters are defined by Anthropic and are not editable.
    """

    name = "computer"
    api_type = "computer_20241022"

    _screenshot_delay = 2.0
    _scaling_enabled = True

    @property
    def options(self) -> ComputerToolOptions:
        width, height = self.scale_coordinates(ScalingSource.COMPUTER, WIDTH, HEIGHT)
        return {
            "display_width_px": width,
            "display_height_px": height,
            "display_number": DISPLAY_NUM,
        }

    def __init__(self):
        super().__init__()
        self.use_dotool = shutil.which("dotool") is not None
        self.xdotool = f"DISPLAY=:{DISPLAY_NUM} xdotool"

    async def __call__(
        self,
        *,
        action: Action,
        text: str | None = None,
        coordinate: tuple[int, int] | None = None,
        **kwargs,
    ):
        if action in ("mouse_move", "left_click_drag"):
            if coordinate is None:
                raise ToolError(f"coordinate is required for {action}")
            if text is not None:
                raise ToolError(f"text is not accepted for {action}")
            if not isinstance(coordinate, list) or len(coordinate) != 2:
                raise ToolError(f"{coordinate} must be a tuple of length 2")
            if not all(isinstance(i, int) and i >= 0 for i in coordinate):
                raise ToolError(f"{coordinate} must be a tuple of non-negative ints")

            x, y = self.scale_coordinates(
                ScalingSource.API, coordinate[0], coordinate[1]
            )

            if self.use_dotool:
                # Convert absolute coordinates to percentages for dotool
                x_pct = x / WIDTH
                y_pct = y / HEIGHT
                if action == "mouse_move":
                    return await self.shell(f'echo "mouseto {x_pct} {y_pct}" | dotool')
                elif action == "left_click_drag":
                    return await self.shell(
                        f'echo "buttondown left\nmouseto {x_pct} {y_pct}\nbuttonup left" | dotool'
                    )
            else:
                if action == "mouse_move":
                    return await self.shell(f"{self.xdotool} mousemove --sync {x} {y}")
                elif action == "left_click_drag":
                    return await self.shell(
                        f"{self.xdotool} mousedown 1 mousemove --sync {x} {y} mouseup 1"
                    )
        if action in ("key", "type"):
            if text is None:
                raise ToolError(f"text is required for {action}")
            if coordinate is not None:
                raise ToolError(f"coordinate is not accepted for {action}")
            if not isinstance(text, str):
                raise ToolError(output=f"{text} must be a string")

            if action == "key" and self.use_dotool:
                return await self.shell(
                    f'echo "key {xdotool_to_dotool_keys(text)}" | dotool'
                )
            elif action == "key":
                return await self.shell(f"{self.xdotool} key -- {text}")
            elif action == "type":
                results: list[ToolResult] = []
                if self.use_dotool:
                    dotool_commands = preprocess_text_for_dotool(text)
                    cmd = f"echo '{dotool_commands}' | dotool"
                    results.append(await self.shell(cmd, take_screenshot=False))
                else:
                    for chunk in chunks(text, TYPING_GROUP_SIZE):
                        cmd = f"{self.xdotool} type --delay {TYPING_DELAY_MS} -- {shlex.quote(chunk)}"
                        results.append(await self.shell(cmd, take_screenshot=False))
                screenshot_base64 = (await self.screenshot()).base64_image
                return ToolResult(
                    output="".join(result.output or "" for result in results),
                    error="".join(result.error or "" for result in results),
                    base64_image=screenshot_base64,
                )

        if action in (
            "left_click",
            "right_click",
            "double_click",
            "middle_click",
            "screenshot",
            "cursor_position",
        ):
            if text is not None:
                raise ToolError(f"text is not accepted for {action}")
            if coordinate is not None:
                raise ToolError(f"coordinate is not accepted for {action}")

            if action == "screenshot":
                return await self.screenshot()
            elif action == "cursor_position":
                # dotool doesn't support getting cursor position
                # Fall back to xdotool for this operation
                result = await self.shell(
                    f"{self.xdotool} getmouselocation --shell",
                    take_screenshot=False,
                )
                output = result.output or ""
                x, y = self.scale_coordinates(
                    ScalingSource.COMPUTER,
                    int(output.split("X=")[1].split("\n")[0]),
                    int(output.split("Y=")[1].split("\n")[0]),
                )
                return result.replace(output=f"X={x},Y={y}")
            else:
                if self.use_dotool:
                    click_arg = {
                        "left_click": "click left",
                        "right_click": "click right",
                        "middle_click": "click middle",
                        "double_click": "click left\nclick left",  # Two quick clicks
                    }[action]
                    return await self.shell(f'echo "{click_arg}" | dotool')
                else:
                    click_arg = {
                        "left_click": "1",
                        "right_click": "3",
                        "middle_click": "2",
                        "double_click": "--repeat 2 --delay 500 1",
                    }[action]
                    return await self.shell(f"{self.xdotool} click {click_arg}")

        raise ToolError(output=f"Invalid action: {action}")

    async def screenshot(self):
        """Take a screenshot of the current screen and return the base64 encoded image."""
        output_dir = Path(OUTPUT_DIR)
        output_dir.mkdir(parents=True, exist_ok=True)
        path = output_dir / f"screenshot_{uuid4().hex}.png"

        # Try gnome-screenshot first
        if shutil.which("gnome-screenshot"):
            screenshot_cmd = f"DISPLAY=:{DISPLAY_NUM} gnome-screenshot -f {path} -p"
        else:
            # Fall back to scrot if gnome-screenshot isn't available
            screenshot_cmd = f"DISPLAY=:{DISPLAY_NUM} scrot -p {path}"

        result = await self.shell(screenshot_cmd, take_screenshot=False)
        if self._scaling_enabled:
            x, y = self.scale_coordinates(ScalingSource.COMPUTER, WIDTH, HEIGHT)
            await self.shell(
                f"convert {path} -resize {x}x{y}! {path}", take_screenshot=False
            )

        if path.exists():
            return result.replace(
                base64_image=base64.b64encode(path.read_bytes()).decode()
            )
        raise ToolError(f"Failed to take screenshot: {result.error}")

    async def shell(self, command: str, take_screenshot=True) -> ToolResult:
        """Run a shell command and return the output, error, and optionally a screenshot."""
        _, stdout, stderr = await run(command)
        base64_image = None

        if take_screenshot:
            # delay to let things settle before taking a screenshot
            await asyncio.sleep(self._screenshot_delay)
            base64_image = (await self.screenshot()).base64_image

        return ToolResult(output=stdout, error=stderr, base64_image=base64_image)

    def scale_coordinates(self, source: ScalingSource, x: int, y: int):
        """Scale coordinates to a target maximum resolution."""
        if not self._scaling_enabled:
            return x, y
        ratio = WIDTH / HEIGHT
        target_dimension = None
        for dimension in MAX_SCALING_TARGETS.values():
            # allow some error in the aspect ratio - not ratios are exactly 16:9
            if abs(dimension["width"] / dimension["height"] - ratio) < 0.02:
                if dimension["width"] < WIDTH:
                    target_dimension = dimension
                break
        if target_dimension is None:
            return x, y
        # should be less than 1
        scaling_factor = target_dimension["width"] / WIDTH
        if source == ScalingSource.COMPUTER:
            # scale down
            return int(x * scaling_factor), int(y * scaling_factor)
        # scale up
        return int(x / scaling_factor), int(y / scaling_factor)


def preprocess_text_for_dotool(text: str) -> str:
    """
    Convert text into a series of dotool commands, handling special characters as keypresses.
    """
    dotool_commands = []
    current_text = ""

    for char in text:
        if char == "\n":
            if current_text:
                dotool_commands.append(f"type {shlex.quote(current_text)}")
                current_text = ""
            dotool_commands.append("key enter")
        elif char == "\t":
            if current_text:
                dotool_commands.append(f"type {shlex.quote(current_text)}")
                current_text = ""
            dotool_commands.append("key tab")
        else:
            current_text += char

    if current_text:
        dotool_commands.append(f"type {shlex.quote(current_text)}")

    return "\n".join(dotool_commands)


def xdotool_to_dotool_keys(text: str):
    # Convert xdotool key syntax to dotool key syntax
    # Only map keys that need special conversion
    key_map = {
        "Return": "enter",
        "Page_Up": "pageup",
        "Page_Down": "pagedown",
        "Escape": "esc",
        "KP_0": "kp0",
        "KP_1": "kp1",
        "KP_2": "kp2",
        "KP_3": "kp3",
        "KP_4": "kp4",
        "KP_5": "kp5",
        "KP_6": "kp6",
        "KP_7": "kp7",
        "KP_8": "kp8",
        "KP_9": "kp9",
    }

    # Split compound keys (e.g., "ctrl+a")
    parts = text.split("+")
    converted_parts = []

    for part in parts:
        # Convert modifiers to lowercase
        if part.lower() in ["ctrl", "alt", "shift", "super"]:
            converted_parts.append(part.lower())
        # Convert special keys or use lowercase for regular keys
        else:
            converted_parts.append(key_map.get(part, part.lower()))

    return "+".join(converted_parts)
