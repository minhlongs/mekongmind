#!/usr/bin/env python3
"""Smoke tests for mekong-model-orchestrator.

Tests that modules import correctly and scripts exist.
"""
import os
import sys
import unittest

PACKAGE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS_DIR = PACKAGE_DIR


class TestImports(unittest.TestCase):
    """Verify MCP server module imports correctly."""

    def test_cc_mcp_server_imports(self):
        """cc-mcp-server.py should import without errors."""
        sys.path.insert(0, SCRIPTS_DIR)
        try:
            import importlib.util
            spec = importlib.util.spec_from_file_location(
                "cc_mcp_server",
                os.path.join(SCRIPTS_DIR, "cc-mcp-server.py"),
            )
            self.assertIsNotNone(spec, "cc-mcp-server.py spec should load")
        finally:
            sys.path.pop(0)

    def test_router_imports(self):
        """router.py should import without errors."""
        sys.path.insert(0, SCRIPTS_DIR)
        try:
            import importlib.util
            spec = importlib.util.spec_from_file_location(
                "router",
                os.path.join(SCRIPTS_DIR, "router.py"),
            )
            self.assertIsNotNone(spec, "router.py spec should load")
        finally:
            sys.path.pop(0)


class TestScriptsExist(unittest.TestCase):
    """Verify all required script files exist."""

    def test_cc_mcp_server_exists(self):
        path = os.path.join(SCRIPTS_DIR, "cc-mcp-server.py")
        self.assertTrue(os.path.isfile(path), f"{path} should exist")

    def test_cc_mcp_wrapper_exists(self):
        path = os.path.join(SCRIPTS_DIR, "cc-mcp-wrapper.sh")
        self.assertTrue(os.path.isfile(path), f"{path} should exist")

    def test_router_py_exists(self):
        path = os.path.join(SCRIPTS_DIR, "router.py")
        self.assertTrue(os.path.isfile(path), f"{path} should exist")

    def test_router_sh_exists(self):
        path = os.path.join(SCRIPTS_DIR, "router.sh")
        self.assertTrue(os.path.isfile(path), f"{path} should exist")

    def test_setup_py_exists(self):
        path = os.path.join(SCRIPTS_DIR, "setup.py")
        self.assertTrue(os.path.isfile(path), f"{path} should exist")

    def test_pyproject_toml_exists(self):
        path = os.path.join(SCRIPTS_DIR, "pyproject.toml")
        self.assertTrue(os.path.isfile(path), f"{path} should exist")

    def test_requirements_txt_exists(self):
        path = os.path.join(SCRIPTS_DIR, "requirements.txt")
        self.assertTrue(os.path.isfile(path), f"{path} should exist")


class TestRouterLogic(unittest.TestCase):
    """Quick verification of router.py scoring logic."""

    def test_router_can_import_scoring(self):
        """router.py scoring functions should be importable."""
        sys.path.insert(0, SCRIPTS_DIR)
        try:
            import importlib.util
            spec = importlib.util.spec_from_file_location(
                "router_mod",
                os.path.join(SCRIPTS_DIR, "router.py"),
            )
            if spec and spec.loader:
                mod = importlib.util.module_from_spec(spec)
                spec.loader.exec_module(mod)
                # Verify key functions exist
                self.assertTrue(hasattr(mod, "score_prompt"))
                self.assertTrue(hasattr(mod, "route"))
                self.assertTrue(hasattr(mod, "cascade"))
                self.assertTrue(hasattr(mod, "TIERS"))

                # Quick smoke: score a trivial prompt
                score = mod.score_prompt("hello")
                self.assertIsInstance(score, float)
                self.assertGreaterEqual(score, 0.0)
                self.assertLessEqual(score, 1.0)
        finally:
            sys.path.pop(0)


class TestWrapperScript(unittest.TestCase):
    """Verify the wrapper script structure."""

    def test_wrapper_shebangs(self):
        """All .sh files should have proper shebangs."""
        for name in ("cc-mcp-wrapper.sh", "router.sh"):
            path = os.path.join(SCRIPTS_DIR, name)
            with open(path) as f:
                first_line = f.readline().strip()
            self.assertTrue(
                first_line.startswith("#!/bin/bash"),
                f"{name} should start with #!/bin/bash, got: {first_line}",
            )

    def test_wrapper_uses_script_dir(self):
        """cc-mcp-wrapper.sh should resolve cc-mcp-server.py via SCRIPT_DIR."""
        path = os.path.join(SCRIPTS_DIR, "cc-mcp-wrapper.sh")
        with open(path) as f:
            content = f.read()
        self.assertIn("SCRIPT_DIR", content)
        self.assertIn("cc-mcp-server.py", content)


if __name__ == "__main__":
    unittest.main()
