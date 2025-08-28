#!/usr/bin/env python3
"""
Generate audio clips for Claude Code task announcements
Run this once to create the MP3 files that will be played by the stop hook
"""

import subprocess
import sys
from pathlib import Path

try:
    import openai
except ImportError:
    print("OpenAI not installed. Run: uv add openai")
    sys.exit(1)


def get_openai_key():
    """Get OpenAI API key from shell environment"""
    try:
        result = subprocess.run(['printenv', 'OPENAI_API_KEY'], 
                              capture_output=True, text=True, check=True)
        return result.stdout.strip()
    except subprocess.CalledProcessError:
        print("Error: OPENAI_API_KEY not found in shell environment")
        sys.exit(1)


def generate_clips():
    """Generate common task completion audio clips"""
    api_key = get_openai_key()
    client = openai.OpenAI(api_key=api_key)

    # Create audio directory
    audio_dir = Path(__file__).parent / "audio"
    audio_dir.mkdir(exist_ok=True)

    # Common announcement messages
    messages = {
        # "task_complete": "Task completed successfully.",
        # "build_complete": "Build completed successfully.",
        # "tests_passed": "All tests passed.",
        # "deployment_complete": "Deployment completed successfully.",
        # "error_fixed": "Error has been fixed.",
        # "ready": "Ready for the next task.",
        "awaiting_instructions": "Awaiting further instructions."
    }

    print("Generating audio clips...")

    for filename, message in messages.items():
        output_path = audio_dir / f"{filename}.mp3"

        if output_path.exists():
            print(f"Skipping {filename} (already exists)")
            continue

        try:
            print(f"Generating {filename}...")
            response = client.audio.speech.create(
                model="tts-1",
                voice="alloy",
                input=message
            )
            
            response.stream_to_file(str(output_path))
            print(f"Created {output_path}")
            
        except Exception as e:
            print(f"Failed to generate {filename}: {e}")
    
    print("\nAudio clips generated successfully!")
    print(f"Files saved to: {audio_dir}")


if __name__ == "__main__":
    generate_clips()