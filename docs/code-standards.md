# MekongMind — Code Standards

## TypeScript

- **Strict mode required.** `tsconfig.json` sets `"strict": true`. No exceptions.
- **Use `type` over `interface`.** Prefer `type` aliases. Use `interface` only for declaration merging or class contracts.
- **No `any`.** Use `unknown` when type is truly dynamic. Use `zod` schemas for runtime validation.
- **ES2022 target.** Module resolution: `bundler`. JSX: `react-jsx`.
- **No `ts-ignore`.** Use `ts-expect-error` with a comment explaining why.
- **Prefer `const` assertions** (`as const`) for literal types and tuple inference.
- **Use `import type`** for type-only imports to avoid runtime bundling.
- **Named exports only.** Avoid `export default` — it breaks tree-shaking and re-exports.

## Python

- **PEP 8 compliance.** Line length 100 (configured in `pyproject.toml` via Black/Ruff).
- **Typer patterns.** CLI commands use Typer decorators with type hints. Group commands under `app = typer.Typer()`.
- **Type hints required.** Use `mypy` with `--strict`. Function signatures must annotate args and return types.
- **Async where appropriate.** Use `async/await` for I/O-bound operations. `pytest-asyncio` for tests.
- **No wildcard imports.** Use explicit `from module import Name`.
- **Poetry for deps.** Managed via `pyproject.toml`. Virtual envs via Poetry.

## Go

- **Standard formatting.** `gofmt` or `go fmt` before every commit. No manual formatting.
- **Error handling.** Always check and return errors. No ignored returns with `_`. Use `fmt.Errorf` with `%w` for error wrapping.
- **Simple over clever.** Prefer explicit control flow over channels/goroutines unless parallelism is needed.
- **`internal/` isolation.** Internal packages stay under `engine/internal/`.

## Monorepo (pnpm + Turbo)

- **Package naming.** `@mekongmind/<name>` for shared packages. Apps are just `apps/<name>`.
- **App naming.** Lowercase, kebab-case. Example: `mekonmind-landing`, `algo-trader-remote`.
- **Workspace management.** All workspace patterns in `pnpm-workspace.yaml`. No `npm` or `yarn` mixing.
- **Turbo pipeline.** Use `turbo.json` for task orchestration. Each app/package defines its own `package.json` scripts.
- **Shared configs.** Root `tsconfig.json` as base. Apps extend via `"extends": "../../tsconfig.json"`.
- **No circular deps.** Package A cannot depend on package B if B depends on A (even transitively).

## Git

- **Conventional commits.** Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `style`, `perf`.
- **Format:** `<type>(<scope>): <description>`. Scope is optional but encouraged.
- **Branch naming.** `feat/<short-name>`, `fix/<issue-description>`, `chore/<task>`.
- **No direct pushes to `main`.** All changes via PR. Squash merge preferred.

## ESLint & Prettier

- **ESLint v9 flat config.** Use `eslint.config.mjs` at root. Apps can extend.
- **Prettier.** Semi: `true`, singleQuote: `true`, trailingComma: `all`, printWidth: `100`, tabWidth: `2`.
- **Run before push.** Format check in CI. Use `turbo run lint` and `turbo run format`.

## Testing

- **TypeScript/JS:** Vitest v4. Use `vitest` config per package. Coverage via `@vitest/coverage-v8`.
- **Python:** pytest with `pytest-asyncio`. Tests in `cli/tests/`. `asyncio_mode = auto`.
- **Go:** Standard `go test`. Tests in `engine/internal/..._test.go` alongside source.
- **Minimum coverage target:** 70% for core packages, 80% for CLI commands.
