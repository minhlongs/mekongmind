# Code Standards

Mechanical conventions. Anything that can be enforced by a linter, is.

## Toolchain

| Concern        | Tool   | Config location          |
| -------------- | ------ | ------------------------ |
| Lint           | ruff   | `pyproject.toml [tool.ruff]` |
| Format         | ruff   | `pyproject.toml [tool.ruff]` (single source of truth, `ruff format`) |
| Test           | pytest | `pyproject.toml [tool.pytest.ini_options]` |
| Coverage       | pytest-cov | CI job arguments         |
| Type checking  | (planned: mypy --strict) | future          |

## Formatting

- `line-length = 100`.
- Trailing commas on multi-line collections.
- Double-quoted strings; ruff's formatter handles this.
- One statement per line. No semicolons.

## Naming

- Modules: `snake_case`.
- Functions, variables: `snake_case`.
- Classes: `PascalCase`.
- Constants: `UPPER_SNAKE_CASE`.
- Private symbols: leading underscore. No `__double_leading` unless writing a
  metaclass.

## Imports

- Order: stdlib, third-party, local.
- One blank line between groups.
- Absolute imports inside the package; relative only between siblings of the
  same subpackage.

## Docstrings

- Triple-double-quoted, one-line for trivial functions, multi-line otherwise.
- Order: summary line, blank line, args, returns, raises, examples.
- Public API has docstrings; private helpers usually do not.

## Error handling

- Raise specific exceptions; never bare `Exception` unless you also re-raise.
- Validate at the boundary (CLI, HTTP). Trust the inside.
- User-visible errors exit with code 1 and a single-line message; details
  belong behind `--verbose`.

## Logging

- Logger name `mekong_foundation`.
- Library code logs; it does not print.
- Use `logger.debug(...)`, `logger.info(...)`, etc. Avoid `logger.warning`
  for control flow.

## Testing standards

- One behavior per test.
- Test name describes the behavior, not the function.
- Use `tmp_path` fixture for filesystem; never write to `/tmp` directly.
- CLI tests use `click.testing.CliRunner`, not subprocess.
- Coverage threshold rises monotonically — never lower it.

## Commits

- Conventional Commits + DCO sign-off + SSH-sign every commit.
- Subject line ≤ 72 chars, imperative mood, lowercase.
- Body wraps at 72 chars; explains *why*, not *what*.
