# Design Guidelines

User-visible design choices for a CLI tool.

## CLI principles

1. **Predictable.** Subcommands map to nouns; flags map to verbs.
   `mekong-foundation version` is right; `mekong-foundation --version-print`
   is wrong.
2. **Composable.** Output goes to stdout; status and errors go to stderr.
   Pipe-friendly.
3. **Quiet by default.** No banners, no spinners, no telemetry. Verbose
   output behind `-v` / `--verbose`.
4. **Honest.** Exit code 0 only when the operation actually succeeded.

## Command shape

```
mekong-foundation [global-flags] <command> [command-flags] [args...]
```

- One command per concept. Sub-subcommands only when the noun has its own
  taxonomy (e.g., `db migrate up`, `db migrate down`).
- Both `-h` and `--help` print help text.

## Output

- Plain text, line-oriented, machine-parseable when reasonable.
- For structured output, support `--json` flag emitting JSON to stdout.
- Color only on a terminal (auto-detect via `click.echo(color=True)`); never
  in piped output.

## Error messages

- Single line on stderr, exit code 1:
  ```
  error: cannot read pyproject.toml: No such file or directory
  ```
- For multiple errors, group with a header and bullet list.

## Internationalization

- English only at this stage. Locale-aware formatting (dates, numbers) when
  it is added must respect `LC_ALL` / `LANG`.

## Documentation tone

- Plain language. Active voice. Short sentences.
- Example-led: show a command, then explain what it does.
- No marketing copy. Pricing and positioning live elsewhere.
