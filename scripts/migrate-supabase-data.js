import { createClient } from '@supabase/supabase-js';

const oldUrl = process.env.OLD_SUPABASE_URL;
const oldKey = process.env.OLD_SUPABASE_SERVICE_ROLE_KEY;
const newUrl = process.env.NEW_SUPABASE_URL;
const newKey = process.env.NEW_SUPABASE_SERVICE_ROLE_KEY;

if (!oldUrl || !oldKey || !newUrl || !newKey) {
  console.error('Missing environment variables. Set OLD_SUPABASE_URL, OLD_SUPABASE_SERVICE_ROLE_KEY, NEW_SUPABASE_URL, NEW_SUPABASE_SERVICE_ROLE_KEY.');
  process.exit(1);
}

const oldSupabase = createClient(oldUrl, oldKey, { auth: { persistSession: false } });
const newSupabase = createClient(newUrl, newKey, { auth: { persistSession: false } });

const tables = [
  'profiles',
  'hierarchy_nodes',
  'user_roles',
  'vaishnav_events',
  'announcements',
  'seva_tasks',
  'todo_items',
  'community_posts',
  'community_comments',
  'community_likes',
  'sadhna_entries',
];

async function copyTable(table) {
  console.log(`\nMigrating table: ${table}`);
  const { data, error } = await oldSupabase.from(table).select('*');
  if (error) {
    throw new Error(`Failed to read ${table}: ${error.message}`);
  }
  if (!data || data.length === 0) {
    console.log(`  No rows found in ${table}, skipping.`);
    return;
  }

  const { error: insertError } = await newSupabase.from(table).upsert(data, { onConflict: 'id' });
  if (insertError) {
    throw new Error(`Failed to insert ${table}: ${insertError.message}`);
  }

  console.log(`  Migrated ${data.length} row(s) to ${table}.`);
}

async function runMigration() {
  console.log('Starting Supabase data migration');
  console.log('Old project:', oldUrl);
  console.log('New project:', newUrl);

  try {
    for (const table of tables) {
      await copyTable(table);
    }
    console.log('\nMigration complete.');
    console.log('IMPORTANT: This script migrates public data tables only.');
    console.log('To preserve existing login passwords, you must also migrate Auth users from the old Supabase project to the new one.');
  } catch (err) {
    console.error('Migration failed:', err.message || err);
    process.exit(1);
  }
}

runMigration();
