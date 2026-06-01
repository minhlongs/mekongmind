"""MekongMind bridge stubs.

Thin wrappers around external adapters (CheetahClaws, OpenClaw).
No credentials are stored here; all secrets live in the external runtime.

Boundary rule: MekongMind imports from this package, never from
``~/.cheetahclaws-src`` or ``~/projects/openclaw`` directly.
"""
from __future__ import annotations

from cli.src.core.cheetahclaws_adapter import CheetahClawsAdapter

__all__: list[str] = ["CheetahClawsAdapter"]
