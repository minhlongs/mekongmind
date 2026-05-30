#!/usr/bin/env python3
"""Setup for mekong-model-orchestrator.

Installs scripts into a bin directory for CLI access.
"""
from setuptools import setup

setup(
    name="mekong-model-orchestrator",
    version="0.1.0",
    description="Mekong IDE - CheetahClaws AI OS Model Orchestrator",
    python_requires=">=3.11",
    scripts=[
        "cc-mcp-server.py",
        "router.py",
    ],
)
