"""Smoke tests for the package metadata and CLI."""

from __future__ import annotations

from click.testing import CliRunner

from mekong_foundation import __version__
from mekong_foundation.cli import main


def test_version_string_is_semver() -> None:
    parts = __version__.split(".")
    assert len(parts) == 3
    assert all(p.isdigit() for p in parts)


def test_cli_version_command_matches_package() -> None:
    runner = CliRunner()
    result = runner.invoke(main, ["version"])
    assert result.exit_code == 0
    assert result.output.strip() == __version__
