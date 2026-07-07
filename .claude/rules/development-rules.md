# Development Rules — Coding Standards for me-deep-wrapper

## Core Principles

Apply YAGNI, KISS, DRY consistently across all mvp/ code.

## TypeScript Strict Mode

- All files: .ts or .tsx (no .js unless migrating legacy)
- `strict: true` in tsconfig.json — no any types allowed except explicit `// @ts-expect-error` with comment
- Use interfaces for props and API responses, not type annotations inline
- Export only what's needed from each module

## Next.js App Router Conventions

- Use app/ directory structure (not pages/)
- Server components by default (`'use client'` only when React hooks needed)
- Route handlers in `app/api/[route]/route.ts` for REST endpoints
- Layouts use the new `layout.tsx` pattern with `children` prop
- Dynamic routes via `[slug]` directory naming

## File Organization in mvp/

```
mvp/app/
├── app/          # Next.js App Router pages
│   ├── (dashboard)/  # Grouped routes by feature
│   └── api/        # API route handlers
├── components/   # Reusable UI components  
├── lib/          # Utility functions, API clients, DB helpers
├── hooks/        # Custom React hooks
└── types/        # TypeScript interfaces and types

mvp/tests/
├── unit/         # Jest + RTL tests
└── e2e/          # Playwright integration tests
```

## Testing Standards

- Unit tests: `*.test.ts` or `*.test.tsx` in same directory as source OR in mvp/tests/unit/
- Integration tests: `*.integration.test.ts` for API endpoints with DB mock
- E2E tests: `*.e2e.ts` using Playwright — one per critical user flow
- Coverage target: 80% minimum for new features, don't retroactively test old code

## Error Handling Pattern

```typescript
// Custom error type
class AppError extends Error {
    constructor(public code: string, message: string) {
        super(message);
    }
}

// Usage pattern — always catch specific errors
try {
    await fetchData();
} catch (err) {
    if (err instanceof AppError) {
        console.error(`Business logic error: ${err.code}`);
    } else {
        console.error('Unexpected error:', err);
    }
}
```

## API Response Format

All API routes must return consistent JSON structure:

```typescript
// Success response
return NextResponse.json({ data: result, success: true });

// Error response (4xx)
return NextResponse.json({ error: 'message', code: 'ERROR_CODE' }, { status: 400 });
```

## Security Rules

- Never commit .env.local or any file with API keys
- Use environment variables for all secrets — validate at runtime via `process.env`
- Validate all user input on the server side (not just frontend)
- Sanitize database queries — use parameterized queries, never string concatenation
- Rate limit all public endpoints

## Component Pattern

```typescript
// Server component (default)
export default async function Page() {
    const data = await fetchData();
    return <MainComponent data={data} />;
}

// Client component — use sparingly
'use client';
export function InteractiveComponent({ initialData }) {
    const [state, setState] = useState(initialData);
    // ...
}
```

## Performance Guidelines

- Use `next/image` for all images (auto optimization)
- Implement lazy loading for routes: `const Dashboard = dynamic(() => import('./dashboard'))`
- Cache API responses where possible (`revalidate`, `force-dynamic`, etc.)
- Avoid unnecessary re-renders with `useMemo`, `useCallback` only when needed

## Git Commit Conventions

```bash
git commit -m "feat: add product checkout flow — closes mvp-live gate"
git commit -m "fix: handle null user in dashboard API"
git commit -m "refactor: simplify auth logic per KISS principle"
git commit -m "test: add unit tests for checkout hooks"
```

## Anti-Patterns to Avoid (KISS + DRY enforcement)

1. Don't create abstractions before you see the pattern — YAGNI
2. Don't duplicate logic between components — extract into lib/ or shared hooks
3. Don't build custom auth when NextAuth.js suffices
4. Don't over-engineer the database schema early — start simple, migrate later
5. Don't use serverless functions for internal API calls — use route handlers

## Code Quality Checklist (before every commit)

- [ ] TypeScript compiles without errors (`tsc --noEmit`)
- [ ] ESLint passes with zero warnings
- [ ] Prettier formatting applied (check `--write` flag in package.json scripts)
- [ ] At least one test file for new functionality
- [ ] No console.log statements left in production code (use proper logger)
- [ ] No TODO comments without deadline or owner
