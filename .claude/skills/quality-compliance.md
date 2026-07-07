# Claude Code — Quality Compliance SOP Skill

When auditing code quality, reviewing changes, or checking for bugs in mvp/:

## Security Audit Checklist
- No hardcoded API keys, secrets, credentials (grep for process.env.VAR references)
- SQL injection prevention: all queries use parameterized syntax
- XSS prevention: no raw innerHTML without sanitization
- CSRF protection on POST/PUT/DELETE endpoints
- Rate limiting on public-facing APIs

## Code Quality Checklist  
- TypeScript strict: no `any` types, proper interfaces for props and responses
- KISS principle: no over-engineering, keep it simple
- DRY principle: extract duplicated logic into shared hooks or lib functions
- YAGNI: remove unused imports, dead code, commented-out sections

## Testing Checklist
- Every new feature has at least one test file (.test.ts or .spec.ts)
- Unit tests cover edge cases (null, empty arrays, API failures)
- Integration tests verify real data flow through the stack
- E2E tests exist for critical user journeys

## Performance Checklist
- No unnecessary re-renders (use React DevTools profiler if needed)
- Server components used by default — client components only when hooks required
- Image optimization via next/image component  
- Bundle size checked (no massive unused dependencies imported)

## Output Format

Report findings as structured JSON:

```json
{
     "security_issues": [],
     "quality_violations": ["line 42: using any instead of proper type"],
     "test_gaps": ["checkout hook has no edge case test for empty cart"],
     "performance_concerns": [],
     "severity": "low|medium|high|critical",
     "recommendations": ["Use interface User instead of type User = {id: string}", ...]
}
```
