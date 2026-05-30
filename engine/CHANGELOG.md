# Changelog

All notable changes to Mekong IDE will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [v0.1.2] — 2026-04-15

### Fixed
- `mekong --version` now exits 0 and prints version (cobra `rootCmd.Version` was unset in v0.1.0/v0.1.1).
- CI runner DNS connectivity preflight: every job aborts fast with actionable error if `github.com` is unreachable from the self-hosted runner (saves ~90s of useless retries on the recurring launchd DNS issue).

### Added
- `mekong version` subcommand: prints version + repo URL + license.

[v0.1.2]: https://github.com/longtho638-jpg/mekong-ide-core/releases/tag/v0.1.2

## [v0.1.1] — 2026-04-15

### Fixed
- Binary now embeds LC_RPATH (`@executable_path/../lib`, `@executable_path/lib`, `/usr/local/lib`) so `libmekong_safety.dylib` loads without manual `install_name_tool` step.
- `--version` correctly reports tag value when built at the tagged commit (CI release job builds at the tag, fixing the v0.1.0 "dev" string).

### Added
- `mekong-vX.Y.Z-darwin-arm64.tar.gz` convenience bundle (binary + dylib + LICENSE + CHANGELOG + install.sh).
- `tools/install.sh` — supports both bundled mode (run after `tar xzf`) and remote mode (`curl | bash`).
- CI release job uploads the tarball alongside raw binary + dylib.

[v0.1.1]: https://github.com/longtho638-jpg/mekong-ide-core/releases/tag/v0.1.1

## [v0.1.0] — 2026-04-15

First public release. Local-first agentic developer runtime for Apple Silicon.

### Added

- Go orchestrator with cobra CLI (`chat` / `agent` / `cashclaw` / `health` / `safety` subcommands)
- Stateful AgentManager backed by BoltDB (4-step pipeline: architect / coder / reasoner / auditor)
- Smart router for MLX endpoints (Gemma 4 :4001, DeepSeek R1 :4002, Qwen Coder :4003)
- CashClaw financial analysis with Kronos foundation model + fair value algorithm (mandatory disclaimer)
- Rust safety FFI cdylib: drawdown tracking + atomic kill-switch persisted at `~/.mekong/kill.lock`
- `mekong safety status|reset` CLI subcommand
- vnstock-mcp HTTP transport (port 5010) for Vietnamese market data
- 3-job CI on M1 Max self-hosted runner (Rust, Go-with-cgo, Python, Linux cross-compile)

### Stack

- Go 1.22 (orchestrator + agents + tools)
- Rust 2021 cdylib (safety FFI, atomic kill-switch)
- Python 3.10+ (vnstock-mcp + Kronos service)
- Apache 2.0 (zero GPL deps)

### Tests

- Rust: 19/19 (release mode, single-threaded for kill.lock determinism)
- Go: 12 packages PASS with -race
- Python: 8/8 (vnstock-mcp HTTP + JSON-RPC spec)

### Artifacts (this release)

- `mekong` — macOS arm64 binary (~9.3 MB, stripped)
- `libmekong_safety.dylib` — Rust safety FFI dylib (~345 KB)
- SHA256 checksums in `SHA256SUMS`

### Known Limitations

- macOS Apple Silicon only (M1/M2/M3 Max). Linux build planned for Phase 5.
- vnstock-mcp HTTP server must be started manually (`tools/vnstock-mcp/start.sh`).
- MT5 connector is darwin-stub only.
- See `docs/project-roadmap.md` Phase 5 candidates.

[v0.1.0]: https://github.com/longtho638-jpg/mekong-ide-core/releases/tag/v0.1.0
