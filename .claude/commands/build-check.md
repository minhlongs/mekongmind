# /build-check

Run the full build + test suite against mvp/.

Usage: `/build-check` (no arguments)

Steps:
1. cd mvp && npm install (only if node_modules missing or stale)
2. Run `npm run lint` — report any errors or warnings
3. Run `npm run build` — verify exit code 0
4. Run `npm test -- --passWithNoTests` — verify all tests pass
5. Report summary as JSON with build status, lint results, test coverage

Use when preparing for deploy gate or before committing changes to main branch.
