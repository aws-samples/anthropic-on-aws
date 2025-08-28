#!/usr/bin/env python3
"""
Python linting hook using Ruff (linting) and optionally mypy (type checking).
Black is for formatting only, not linting.
Provides real-time code quality feedback for Python files.
"""

import json
import sys
import subprocess
import os
from pathlib import Path
from datetime import datetime


def is_python_file(file_path):
    """Check if the file is a Python file."""
    if not file_path:
        return False

    path = Path(file_path)
    return path.suffix in [".py", ".pyi", ".pyx"]


def check_formatting(file_path):
    """Check if file is properly formatted with Black (formatting, not linting)."""
    try:
        result = subprocess.run(
            ["black", "--check", "--quiet", file_path],
            capture_output=True,
            text=True,
            timeout=5,
        )

        if result.returncode != 0:
            return {
                "tool": "black (formatting)",
                "passed": False,
                "message": "File needs formatting",
            }
        return {"tool": "black (formatting)", "passed": True}
    except subprocess.TimeoutExpired:
        return {"tool": "black (formatting)", "passed": True, "error": "Timeout"}
    except FileNotFoundError:
        return {
            "tool": "black (formatting)",
            "passed": True,
            "error": "Black not installed",
        }
    except Exception as e:
        return {"tool": "black (formatting)", "passed": True, "error": str(e)}


def run_ruff(file_path):
    """Run Ruff linter for fast Python linting."""
    try:
        result = subprocess.run(
            ["ruff", "check", file_path, "--output-format", "json"],
            capture_output=True,
            text=True,
            timeout=10,
        )

        if result.returncode != 0:
            try:
                errors = json.loads(result.stdout) if result.stdout else []
            except:
                errors = result.stdout

            return {
                "tool": "ruff",
                "passed": False,
                "errors": errors,
                "error": result.stderr,
            }
        return {"tool": "ruff", "passed": True}
    except subprocess.TimeoutExpired:
        return {"tool": "ruff", "passed": False, "error": "Timeout"}
    except FileNotFoundError:
        # Fallback to flake8 if ruff is not installed
        print(
            "⚠️  Ruff not found, falling back to flake8 (install ruff for better performance)",
            file=sys.stderr,
        )
        return run_flake8(file_path)
    except Exception as e:
        return {"tool": "ruff", "passed": False, "error": str(e)}


def run_flake8(file_path):
    """Fallback to flake8 if Ruff is not available."""
    try:
        result = subprocess.run(
            ["flake8", file_path, "--max-line-length=88"],
            capture_output=True,
            text=True,
            timeout=10,
        )

        if result.returncode != 0:
            return {
                "tool": "flake8",
                "passed": False,
                "output": result.stdout,
                "error": result.stderr,
            }
        return {"tool": "flake8", "passed": True}
    except FileNotFoundError:
        return {
            "tool": "no-linter",
            "passed": True,
            "error": "No Python linters available (ruff or flake8 recommended)",
            "install_help": True,
        }
    except Exception as e:
        return {"tool": "flake8", "passed": False, "error": str(e)}


def run_mypy(file_path):
    """Run mypy for type checking."""
    try:
        result = subprocess.run(
            ["mypy", file_path, "--ignore-missing-imports"],
            capture_output=True,
            text=True,
            timeout=15,
        )

        if result.returncode != 0:
            return {
                "tool": "mypy",
                "passed": False,
                "output": result.stdout,
                "error": result.stderr,
            }
        return {"tool": "mypy", "passed": True}
    except subprocess.TimeoutExpired:
        return {"tool": "mypy", "passed": False, "error": "Timeout"}
    except FileNotFoundError:
        return {
            "tool": "mypy",
            "passed": True,
            "error": "Mypy not installed (optional - for type checking)",
            "optional": True,
        }
    except Exception as e:
        return {"tool": "mypy", "passed": False, "error": str(e)}


def save_lint_results(file_path, results, session_id):
    """Save linting results to a JSON file."""
    try:
        claude_dir = Path(".claude")
        claude_dir.mkdir(exist_ok=True)

        log_file = claude_dir / "python_lint_errors.json"

        # Load existing results or create new list
        if log_file.exists():
            with open(log_file, "r") as f:
                all_results = json.load(f)
        else:
            all_results = []

        # Add new result
        all_results.append(
            {
                "timestamp": datetime.now().isoformat(),
                "session_id": session_id,
                "file": file_path,
                "results": results,
            }
        )

        # Keep only last 100 results
        all_results = all_results[-100:]

        # Save updated results
        with open(log_file, "w") as f:
            json.dump(all_results, f, indent=2)
    except Exception:
        # Don't fail if we can't save results
        pass


def main():
    try:
        # Read Claude Code hook input from stdin
        input_data = json.load(sys.stdin)

        tool_name = input_data.get("tool_name", "")
        session_id = input_data.get("session_id", "unknown")
        tool_input = input_data.get("tool_input", {})

        # Only process file editing operations
        if tool_name not in ["Edit", "Write", "MultiEdit"]:
            sys.exit(0)

        file_path = tool_input.get("file_path", "")

        # Only lint Python files
        if not is_python_file(file_path):
            sys.exit(0)

        # Check if file exists
        if not os.path.exists(file_path):
            sys.exit(0)

        # Run linting tools
        results = []
        has_errors = False
        error_messages = []

        # Check formatting (not linting)
        format_result = check_formatting(file_path)
        results.append(format_result)
        if not format_result["passed"] and "message" in format_result:
            has_errors = True
            error_messages.append(f"Formatting: {format_result['message']}")

        # Run Ruff (or flake8 as fallback)
        ruff_result = run_ruff(file_path)
        results.append(ruff_result)
        if not ruff_result["passed"] and "errors" in ruff_result:
            has_errors = True
            if isinstance(ruff_result["errors"], list):
                error_messages.append(
                    f"{ruff_result['tool']}: Found {len(ruff_result['errors'])} issues"
                )
            else:
                error_messages.append(f"{ruff_result['tool']}: Found issues")

        # Run mypy
        mypy_result = run_mypy(file_path)
        results.append(mypy_result)
        if not mypy_result["passed"] and "output" in mypy_result:
            has_errors = True
            error_messages.append(f"Mypy: Type checking issues found")

        # Save results
        save_lint_results(file_path, results, session_id)

        # Check if we need to show installation help
        need_install_help = any(
            result.get("install_help") or result.get("optional")
            for result in results
            if "install_help" in result or "optional" in result
        )

        if need_install_help:
            print(
                """
📝 Python Quality Tools Installation Guide

For the best Python development experience, install these tools:

  # Option 1: Using UV (recommended)
  uv tool install ruff black mypy
  # or for one-time use: uvx ruff check . && uvx black .

  # Option 2: Using pip
  pip install ruff black mypy
  
  # Option 3: System package manager
  # Ubuntu/Debian: sudo apt install python3-ruff python3-black python3-mypy
  # macOS: brew install ruff black mypy

Tools:
- ruff: Fast linting (replaces flake8, isort, and more)
- black: Code formatting
- mypy: Type checking (optional but recommended)
""",
                file=sys.stderr,
            )

        # If there are errors, report them
        if has_errors:
            error_msg = f"""
⚠️  Python linting issues found in {file_path}

{chr(10).join(error_messages)}

To fix automatically:
  black {file_path}
  ruff check --fix {file_path}

For detailed errors, check .claude/python_lint_errors.json
"""
            print(error_msg, file=sys.stderr)
            # Exit with code 2 so Claude can see and fix the issues
            sys.exit(2)

        # All checks passed
        sys.exit(0)

    except json.JSONDecodeError:
        # If we can't parse JSON, just allow the operation
        sys.exit(0)
    except Exception as e:
        # On any other error, allow the operation to proceed
        print(f"Linting error: {e}", file=sys.stderr)
        sys.exit(0)


if __name__ == "__main__":
    main()
