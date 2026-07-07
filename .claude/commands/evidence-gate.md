# /evidence-gate

Run the engineering-factory SOP gate evidence validation.

Usage: `/evidence-gate` (no arguments)

Steps:
1. Check if offer-validated.json exists in state/products/evidence/
2. Verify mvp-live.json has all required fields from engineering-factory.md contract:
   - routes, apis, data_model, integrations, checkout_path
   - build_command, tests_run, known_risks  
3. Run `npm run build` and verify exit code 0
4. Run `npm test` and verify at least green tests pass
5. Report gate status as JSON with pass/fail

Use when claiming a feature is ready for handoff to Quality Compliance department.
