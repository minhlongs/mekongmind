# /code-audit

Run a comprehensive quality-compliance SOP audit on current mvp/ code changes.

Steps:
1. Read sops/departments/quality-compliance.md for gate requirements  
2. Git diff to find modified files since last commit
3. Scan each file against these categories:

**Security**: hardcoded secrets, SQL injection, XSS vulnerabilities, missing CSRF protection, absent rate limiting
**Quality**: TypeScript strictness (no any), KISS violations (over-engineering), DRY violations (duplicated code), YAGNI (dead code)  
**Testing**: missing test files for new features, no edge case coverage, no integration tests
**Performance**: unnecessary re-renders, client components where server would work, unoptimized images

4. Output structured JSON report with severity levels:

```json
{
    "security_issues": [
        {"file": "mvp/api/auth.ts", "line": 15, "issue": "hardcoded API key found", "severity": "critical"}
    ],
    "quality_violations": [],
    "test_gaps": ["mvp/app/checkout/page.tsx has no corresponding test file"],
    "performance_concerns": [
        {"file": "mvp/components/ProductCard.tsx", "issue": "client component but uses no hooks", "severity": "low"}
    ],
    "overall_severity": "medium",
    "recommendations": [
        "Remove hardcoded API key from auth.ts and use process.env.STRIPE_KEY"
    ]
}
```

5. Block handoff to next department if severity=critical or severity=high with security issues
