"""Command-line entry point."""

from __future__ import annotations

import click

from . import __version__


@click.group(context_settings={"help_option_names": ["-h", "--help"]})
def main() -> None:
    """mekong-foundation command-line interface."""


@main.command()
def version() -> None:
    """Print the package version."""
    click.echo(__version__)


if __name__ == "__main__":
    main()
