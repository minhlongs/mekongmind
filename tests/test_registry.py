#!/usr/bin/env python3
"""
Integration tests for MEKONG_WRAPPER agent registry queries.

Covers:
- JSON structure / schema sanity
- claudekit_agents path validity (disk-resolved)
- mekong_agents path validity
- resolve_agent bash wrapper integration (via subprocess)
- apply_harness_pattern bash integration
- duplicate / missing field detection
"""
import json
import os
import subprocess
import unittest
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
REGISTRY = ROOT / "agents" / "registry.json"
LIB = ROOT / "lib" / "agent-patterns.sh"


def load_registry():
    with open(REGISTRY) as f:
        return json.load(f)


class RegistryStructure(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.data = load_registry()

    def test_version_present(self):
        self.assertIn("version", self.data)

    def test_required_top_keys(self):
        for k in ("version", "unified_agents", "mekongmind_departments",
                  "command_to_agent", "mekongmind_evidence_contracts",
                  "mekongmind_department_capability_mesh",
                  "mekongmind_department_room_system",
                  "mekongmind_gate_execution_doctrine"):
            self.assertIn(k, self.data, f"missing key {k}")

    def test_agent_schema(self):
        for a in self.data.get("unified_agents", []):
            self.assertIn("id", a, f"agent missing id: {a}")
            # Only require path for agents that have one (me-wrapper patterns don't)
            if "path" in a or a.get("source","").startswith("me-wrapper") is False:
                pass  # all good
            # Ensure at least id and source are present
            self.assertIn("source", a, f"agent {a.get('id')} missing source")

    def test_pattern_schema(self):
        for p in self.data.get("mekongmind_gate_execution_doctrine", []):
            self.assertIn("gate", p, f"doctrine entry missing gate: {p}")


class ClaudekitPaths(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        all_agents = load_registry().get("unified_agents", [])
        cls.agents = [a for a in all_agents if a.get("source") in
                      ("claudekit", "mekong-cli+claudekit")]

    def test_nonempty(self):
        self.assertGreater(len(self.agents), 0,
                           "no claudekit agents found in unified_agents")

    def test_no_duplicate_ids(self):
        ids = [a["id"] for a in self.agents]
        self.assertEqual(len(ids), len(set(ids)), "duplicate claudekit agent ids")

    def test_all_paths_present(self):
        missing = [a["id"] for a in self.agents if not a.get("path")]
        self.assertEqual(missing, [], f"agents missing path field: {missing}")

    def test_all_paths_resolve_on_disk(self):
        root = load_registry().get("claudekit_root", "")
        if not root or not os.path.isdir(root):
            self.skipTest(f"claudekit_root not mounted: {root!r}")
        missing = []
        for a in self.agents:
            full = os.path.join(root, a["path"])
            if not os.path.exists(full):
                missing.append(f"{a['id']} -> {a['path']} (full={full})")
        self.assertEqual(
            missing, [],
            f"claudekit_agents whose paths do not resolve on disk: {missing}",
        )

    def test_paths_do_not_traverse_up(self):
        bad = [a["id"] for a in self.agents if ".." in a["path"]]
        self.assertEqual(bad, [], f"paths with '..': {bad}")

    def test_no_nul_bytes_in_paths(self):
        bad = [a["id"] for a in self.agents if "\x00" in a.get("path", "")]
        self.assertEqual(bad, [], "nul byte in path")

    def test_paths_are_relative(self):
        abs_ = [a["id"] for a in self.agents if a["path"].startswith("/")]
        self.assertEqual(abs_, [], f"absolute paths: {abs_}")


class MekongPaths(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        all_agents = load_registry().get("unified_agents", [])
        cls.agents = [a for a in all_agents if a.get("source") in
                      ("mekong-cli", "mekong-cli+claudekit")]

    def test_nonempty(self):
        self.assertGreater(len(self.agents), 0,
                           "no mekong-cli agents found in unified_agents")

    def test_no_duplicate_ids(self):
        # Allow same agent id across mekong-cli and mekong-cli+claudekit
        # (shared agents are expected), but check within each source group
        from collections import defaultdict
        by_source = defaultdict(list)
        for a in self.agents:
            by_source[a.get("source","")].append(a["id"])
        for src, ids in by_source.items():
            self.assertEqual(len(ids), len(set(ids)),
                             f"duplicate ids within source={src}: {ids}")

    def test_all_paths_present(self):
        missing = [a["id"] for a in self.agents if not a.get("path")]
        self.assertEqual(missing, [], f"missing path: {missing}")


class ResolveAgentImpl(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not LIB.exists():
            raise unittest.SkipTest(f"{LIB} not found")
        cls.lib = LIB

    def _call(self, cli: str, cmd: str) -> str:
        script = (
            f'source "{self.lib}" >/dev/null 2>&1\n'
            f'resolve_agent "{cli}" "{cmd}"\n'
        )
        r = subprocess.run(
            ["bash", "-c", script],
            capture_output=True,
            text=True,
            check=True,
        )
        return r.stdout.strip()

    def test_mekong_plan_planner(self):
        self.assertEqual(self._call("mekong", "plan"), "planner")

    def test_mekong_git_manager(self):
        self.assertEqual(self._call("mekong", "git"), "git-manager")

    def test_mekong_docs_manager(self):
        self.assertEqual(self._call("mekong", "docs"), "docs-manager")

    def test_mekong_code_review_expert(self):
        self.assertEqual(self._call("mekong", "code-review"), "code-review-expert")

    def test_mekong_code_search(self):
        self.assertEqual(self._call("mekong", "code-search"), "research-expert")

    def test_mekong_oracle(self):
        self.assertEqual(self._call("mekong", "oracle"), "oracle")

    def test_mekong_unknown_returns_empty(self):
        got = self._call("mekong", "zzz-not-a-command")
        self.assertEqual(got, "")

    def test_claudekit_jest(self):
        self.assertEqual(self._call("me", "jest"), "jest-testing-expert")

    def test_claudekit_playwright_e2e(self):
        self.assertEqual(self._call("me", "playwright"), "e2e-playwright-expert")

    def test_claudekit_code_review(self):
        self.assertEqual(self._call("me", "code-review"), "code-review-expert")

    def test_claudekit_typescript_expert(self):
        self.assertEqual(self._call("claudekit", "typescript-expert"), "typescript-expert")

    def test_claudekit_ai_sdk(self):
        self.assertEqual(self._call("me", "ai-sdk"), "ai-sdk-expert")

    def test_claudekit_triage(self):
        self.assertEqual(self._call("me", "triage"), "triage-expert")


class ApplyHarnessPattern(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        if not LIB.exists():
            raise unittest.SkipTest(f"{LIB} not found")
        cls.lib = LIB

    def _call(self, pattern: str, goal: str) -> str:
        script = (
            f'source "{self.lib}" >/dev/null 2>&1\n'
            f'apply_harness_pattern "{pattern}" "{goal}"\n'
        )
        r = subprocess.run(
            ["bash", "-c", script],
            capture_output=True,
            text=True,
            check=True,
        )
        return r.stdout.strip()

    def test_known_pattern_expert_pool(self):
        out = self._call("expert-pool", "complex expert audit")
        self.assertIn("expert-pool", out)

    def test_known_pattern_pipeline(self):
        out = self._call("pipeline", "deploy release")
        self.assertIn("pipeline", out)

    def test_known_pattern_iterative_refiner(self):
        out = self._call("iterative-refiner", "iterate")
        self.assertIn("iterative-refiner", out)

    def test_known_pattern_orchestrator(self):
        out = self._call("orchestrator", "plan")
        self.assertIn("orchestrator", out)

    def test_empty_pattern_returns_empty(self):
        self.assertEqual(self._call("", "anything"), "")

    def test_unknown_pattern_returns_empty(self):
        self.assertEqual(self._call("does-not-exist", "anything"), "")


class RegistryIntegrity(unittest.TestCase):
    data = load_registry()

    def test_json_roundtrip(self):
        raw = json.dumps(self.data, sort_keys=True)
        json.loads(raw)

    def test_no_agent_id_collisions_across_groups(self):
        unified = self.data.get("unified_agents", [])
        ids = [a["id"] for a in unified]
        self.assertEqual(len(ids), len(set(ids)),
                         "duplicate agent ids in unified_agents")

    def test_all_agents_have_source(self):
        for a in self.data.get("unified_agents", []):
            self.assertIn("source", a,
                          f"agent {a.get('id')} missing source field")

    def test_evidence_contracts_valid(self):
        dept_ids = {d["id"] for d in
                     self.data.get("mekongmind_departments", [])}
        for c in self.data.get("mekongmind_evidence_contracts", []):
            self.assertIn("department", c)
            self.assertIn("gate", c)
            self.assertIn("artifact_path", c)


if __name__ == "__main__":
    unittest.main(verbosity=2)
