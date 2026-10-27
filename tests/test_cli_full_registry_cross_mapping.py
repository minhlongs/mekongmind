#!/usr/bin/env python3
"""Integration tests for the Full 100% Mekong CLI Registry & 10-Department Cross-Mapping."""

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AGENT_REGISTRY = ROOT / "agents" / "registry.json"
CLI_FULL_REGISTRY = ROOT / "mvp" / "src" / "data" / "cli-full-registry.json"
CLI_PAGE_TSX = ROOT / "mvp" / "src" / "app" / "(landing)" / "cli" / "page.tsx"


class CliFullRegistryCrossMappingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(AGENT_REGISTRY, encoding="utf-8") as handle:
            cls.agent_reg = json.load(handle)
        with open(CLI_FULL_REGISTRY, encoding="utf-8") as handle:
            cls.cli_reg = json.load(handle)
        cls.valid_departments = {
            dept["id"] for dept in cls.agent_reg.get("mekongmind_departments", [])
        }
        cls.valid_layers = {"L0", "L1", "L2", "L3", "L4", "L5"}
        cls.valid_clusters = {"csuite", "sdlc", "bizops", "vn_statutory"}

    def test_full_coverage_exceeds_189_commands(self):
        self.assertGreaterEqual(
            len(self.cli_reg),
            189,
            f"Expected >= 189 commands, found {len(self.cli_reg)}",
        )

    def test_no_duplicate_command_ids(self):
        ids = [entry["id"] for entry in self.cli_reg]
        self.assertEqual(len(ids), len(set(ids)), "Duplicate command IDs found")

    def test_no_command_is_naked_invariant(self):
        for entry in self.cli_reg:
            cmd_id = entry.get("id")
            self.assertTrue(entry.get("command", "").startswith("mekong "), cmd_id)
            self.assertIn(entry.get("departmentId"), self.valid_departments, cmd_id)
            self.assertIn(entry.get("layerId"), self.valid_layers, cmd_id)
            self.assertIn(entry.get("cluster"), self.valid_clusters, cmd_id)
            self.assertTrue(entry.get("ownerAgent"), f"{cmd_id} missing ownerAgent")
            self.assertGreaterEqual(
                len(entry.get("supportAgents", [])), 1, f"{cmd_id} missing supportAgents"
            )
            self.assertGreaterEqual(
                len(entry.get("sopChain", [])), 4, f"{cmd_id} must have >= 4-step SOP chain"
            )
            self.assertTrue(
                entry.get("gateArtifact", "").startswith("state/evidence/"),
                f"{cmd_id} invalid gateArtifact",
            )

    def test_all_10_departments_populated(self):
        covered_depts = {entry["departmentId"] for entry in self.cli_reg}
        self.assertEqual(covered_depts, self.valid_departments)

    def test_all_6_operating_layers_populated(self):
        covered_layers = {entry["layerId"] for entry in self.cli_reg}
        self.assertEqual(covered_layers, self.valid_layers)

    def test_all_4_business_clusters_populated(self):
        covered_clusters = {entry["cluster"] for entry in self.cli_reg}
        self.assertEqual(covered_clusters, self.valid_clusters)

    def test_cli_page_has_numbered_pagination_and_page_size_controls(self):
        src = CLI_PAGE_TSX.read_text(encoding="utf-8")
        self.assertIn("PAGE_SIZE_OPTIONS: PageSizeOption[] = [12, 24, 48, 'all']", src)
        self.assertIn("buildPaginationItems", src)
        self.assertIn("paginatedCommands", src)
        self.assertIn("command-registry-explorer", src)
        self.assertIn("BOTTOM NUMBERED PAGINATION BAR", src)

    def test_cli_page_has_three_pane_workbench_shell(self):
        src = CLI_PAGE_TSX.read_text(encoding="utf-8")
        self.assertIn("lg:grid-cols-12", src)
        self.assertIn("grid-cols-1", src)
        self.assertIn("lg:col-span-3", src)
        self.assertIn("lg:col-span-5", src)
        self.assertIn("lg:col-span-4", src)
        self.assertIn("command-registry-explorer", src)
        self.assertIn("live-command-inspector", src)

    def test_cli_page_has_five_pin_circuit_and_run_simulation(self):
        src = CLI_PAGE_TSX.read_text(encoding="utf-8")
        self.assertIn('id="live-command-inspector"', src)
        self.assertIn('viewBox="0 0 520 250"', src)
        self.assertIn("SOVEREIGN IC", src)
        self.assertIn("PIN 1 · CLI Input", src)
        self.assertIn("PIN 5 · SHA-256 Gate Artifact", src)
        self.assertIn("▶ Run Simulation", src)
        self.assertIn("simStep", src)

    def test_cli_page_has_four_tab_inspector(self):
        src = CLI_PAGE_TSX.read_text(encoding="utf-8")
        self.assertIn("InspectorTabId", src)
        self.assertIn("'overview' | 'pinout' | 'simulator' | 'specs'", src)
        for tab_id in ("overview", "pinout", "simulator", "specs"):
            self.assertIn(f"inspector-panel-{tab_id}", src)

    def test_cli_page_has_url_hash_deep_linking(self):
        src = CLI_PAGE_TSX.read_text(encoding="utf-8")
        self.assertIn("window.location.hash", src)
        self.assertIn("hashchange", src)
        self.assertIn("history.replaceState", src)


if __name__ == "__main__":
    unittest.main(verbosity=2)
