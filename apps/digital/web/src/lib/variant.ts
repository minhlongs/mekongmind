export type Variant = 'generic' | 'ocop' | 'htx' | 'tourism';

export const VARIANTS: readonly Variant[] = ['generic', 'ocop', 'htx', 'tourism'] as const;

export function parseVariant(searchParams: URLSearchParams): Variant {
  const v = searchParams.get('v');
  if (v && (VARIANTS as readonly string[]).includes(v)) {
    return v as Variant;
  }
  return 'generic';
}
