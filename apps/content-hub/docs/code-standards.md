# Mekong Content Hub — Code Standards

## TypeScript

- `strict: true` enabled
- No `any` in production code (except supabase untyped client with `@ts-nocheck`)
- Interfaces over type aliases for public APIs

## File Structure

- kebab-case for all file names
- One component/function per file
- Max 200 lines per file (split if larger)

## API Routes

- Next.js App Router pattern (`route.ts` exports)
- All API routes: `runtime = "nodejs"`, `dynamic = "force-dynamic"`
- Consistent response: `NextResponse.json({ data/error })`

## Database

- All queries through supabase client
- RLS enforced on `contents` table
- Migration files in `supabase/migrations/`

## Error Handling

- try/catch for all async operations
- Return structured error: `{ error: string, code?: string }`

## Testing

- Vitest + jsdom
- Tests in `tests/` directory
- 80% coverage target
