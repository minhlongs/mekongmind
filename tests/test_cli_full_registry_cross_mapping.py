#!/usr/bin/env python3
"""Integration tests for the Full 100% Mekong CLI Registry & 10-Department Cross-Mapping."""

import json
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AGENT_REGISTRY = ROOT / "agents" / "registry.json"
CLI_FULL_REGISTRY = ROOT / "mvp" / "src" / "data" / "cli-full-registry.json"
CAPABILITY_LEDGER = ROOT / "mvp" / "src" / "data" / "capability-ledger.json"
CLI_PAGE_TSX = ROOT / "mvp" / "src" / "app" / "(landing)" / "cli" / "page.tsx"


class CliFullRegistryCrossMappingTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        with open(AGENT_REGISTRY, encoding="utf-8") as handle:
            cls.agent_reg = json.load(handle)
        with open(CLI_FULL_REGISTRY, encoding="utf-8") as handle:
            cls.cli_reg = json.load(handle)
        with open(CAPABILITY_LEDGER, encoding="utf-8") as handle:
            cls.cap_ledger = json.load(handle)
        cls.valid_departments = {
            dept["id"] for dept in cls.agent_reg.get("mekongmind_departments", [])
        }
        cls.valid_layers = {"L0", "L1", "L2", "L3", "L4", "L5"}
        cls.valid_clusters = {"csuite", "sdlc", "bizops", "vn_statutory"}
        cls.valid_maturity_tiers = {"REAL_VERIFIED", "PARTIAL_LOOKUP", "CATALOG_ONLY"}
        cls.required_contract_fields = {
            "claim_id",
            "promise_summary",
            "display_source",
            "input_schema",
            "cli_entrypoint",
            "api_transport",
            "handler_path",
            "owner_agent",
            "sop_steps",
            "data_rw",
            "output_schema",
            "external_effects",
            "approval_policy",
            "acceptance_criteria",
            "test_evidence",
            "maturity_tier",
        }

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

    def test_capability_ledger_has_197_commands_and_16_contract_columns(self):
        self.assertEqual(len(self.cap_ledger), 197)
        for entry in self.cap_ledger:
            missing = self.required_contract_fields - set(entry.keys())
            self.assertFalse(missing, f"Missing contract fields in {entry.get('name')}: {missing}")
            self.assertIn(entry["maturity_tier"], self.valid_maturity_tiers)

    def test_cli_page_de_simulated_and_wired_for_live_execution(self):
        src = CLI_PAGE_TSX.read_text(encoding="utf-8")
        self.assertNotIn("GATE_PASSED_SHA256", src)
        self.assertIn("MATURITY_TIERS", src)
        self.assertIn("handleRunLiveCommand", src)
        self.assertIn("handleVerifyReceipt", src)
        self.assertIn("/api/cli/runs", src)
        self.assertIn("/api/cli/receipts/verify", src)


if __name__ == "__main__":
    unittest.main(verbosity=2)

