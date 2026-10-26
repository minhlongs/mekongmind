#!/usr/bin/env python3
"""Integration tests for the Full 100% Mekong CLI Registry & 10-Department Cross-Mapping."""

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AGENT_REGISTRY = ROOT / "agents" / "registry.json"
CLI_FULL_REGISTRY = ROOT / "mvp" / "src" / "data" / "cli-full-registry.json"


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


if __name__ == "__main__":
    unittest.main(verbosity=2)
