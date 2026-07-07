# /mvp-build

Run the full mvp build pipeline — install dependencies, lint, build, and test.

Steps:
1. cd /Users/macbook/Documents/me-deep-wrapper/mvp
2. Check if node_modules exists; if not or stale, run npm install
3. Run npm run lint (report errors only)
4. Run npm run build (verify exit code 0 — fail if not)  
5. Run npm test --passWithNoTests (show summary)
6. Output build report as JSON:

```json
{
   "status": "pass|fail",
   "lint_errors": [],
   "build_time_seconds": 12,
   "test_count": 42,
   "tests_passed": 42,
   "tests_failed": 0,
   "coverage_percent": 78.5
}
```

Use when claiming engineering-factory gate evidence or before committing changes.
