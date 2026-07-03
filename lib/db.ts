import { neon, types } from '@neondatabase/serverless';

// DATE columns come back as plain 'YYYY-MM-DD' strings, not JS Date objects.
// Without this, `String(run.run_date).slice(0, 10)` produces "Fri Jul 03"
// garbage and everything date-shaped breaks (labels, ICS, sorting).
types.setTypeParser(1082 /* DATE */, (v: string) => v);

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
