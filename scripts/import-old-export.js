import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const parseEnvFile = (filePath) => {
  const raw = readFileSync(filePath, 'utf8');
  return Object.fromEntries(
    raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const [key, ...rest] = line.split('=');
        const value = rest.join('=').trim();
        return [key.trim(), value.replace(/^"|"$/g, '')];
      })
  );
};

const envPath = join(process.cwd(), '.env.migration');
if (!existsSync(envPath)) {
  console.error('.env.migration not found in repo root. Create it from .env.migration.example.');
  process.exit(1);
}

const env = parseEnvFile(envPath);
const NEW_SUPABASE_URL = env.NEW_SUPABASE_URL;
const NEW_SUPABASE_SERVICE_ROLE_KEY = env.NEW_SUPABASE_SERVICE_ROLE_KEY;

if (!NEW_SUPABASE_URL || !NEW_SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing NEW_SUPABASE_URL or NEW_SUPABASE_SERVICE_ROLE_KEY in .env.migration');
  process.exit(1);
}

const baseDir = process.argv[2] || 'old-export';
const tables = [
  'profiles',
  'user_roles',
  'hierarchy_nodes',
  'sadhna_entries',
  'todo_items',
  'vaishnav_events',
];

const supabase = createClient(NEW_SUPABASE_URL, NEW_SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const importTable = async (table) => {
  const path = join(process.cwd(), baseDir, 'tables', `${table}.json`);
  if (!existsSync(path)) {
    console.warn(`Skipping ${table}: file not found: ${path}`);
    return;
  }

  const raw = readFileSync(path, 'utf8');
  const data = JSON.parse(raw);
  if (!Array.isArray(data) || data.length === 0) {
    console.log(`No rows for ${table}, skipping.`);
    return;
  }

  console.log(`Importing ${data.length} rows into ${table}...`);
  const { error } = await supabase.from(table).upsert(data, { onConflict: 'id' });
  if (error) {
    throw new Error(`Failed to import ${table}: ${error.message}`);
  }
  console.log(`Imported ${table} successfully.`);
};

const run = async () => {
  console.log('Using new Supabase:', NEW_SUPABASE_URL);
  console.log('Reading export files from:', baseDir);

  for (const table of tables) {
    await importTable(table);
  }

  console.log('Import complete.');
};

run().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
