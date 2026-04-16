import { neon } from '@neondatabase/serverless';

// Row type returned by queries
export type Row = Record<string, unknown>;

// Tagged-template sql function type
export type SqlFn = (strings: TemplateStringsArray, ...values: unknown[]) => Promise<Row[]>;

let _raw: ReturnType<typeof neon> | null = null;

// Lazily initialized — safe to import during build without DATABASE_URL
export function db(): SqlFn {
  if (!_raw) {
    _raw = neon(process.env.DATABASE_URL!);
  }
  const raw = _raw;
  return (strings: TemplateStringsArray, ...values: unknown[]) =>
    raw(strings, ...values) as Promise<Row[]>;
}
