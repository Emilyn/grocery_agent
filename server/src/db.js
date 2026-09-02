import pg from 'pg';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const { Pool, types } = pg;

// Return DATE columns as plain 'YYYY-MM-DD' strings instead of JS Date
// objects, which node-postgres would otherwise convert using local
// server time and shift by a day near midnight.
types.setTypeParser(types.builtins.DATE, (value) => value);

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('railway') ? { rejectUnauthorized: false } : false
});

export async function ensureSchema() {
  const schemaPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'schema.sql');
  const schema = readFileSync(schemaPath, 'utf8');
  await pool.query(schema);
}
