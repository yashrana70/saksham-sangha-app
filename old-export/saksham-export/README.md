# Saksham Sadhu Sang — Data Export

Generated for migration to a new Supabase project.

## What's included

### `tables/` — Row data (CSV + JSON) for all 6 public tables
| Table | Rows (incl. header) |
|---|---|
| profiles | 59 |
| user_roles | 58 |
| hierarchy_nodes | 25 |
| sadhna_entries | 354 |
| todo_items | 6 |
| vaishnav_events | 62 |

### Schema files
- `schema.sql` — `CREATE TABLE` for all public tables
- `enums.sql` — `app_role` enum
- `functions.sql` — all 14 database functions (`has_role`, `get_downline_ids`, `get_hierarchy_tree`, leaderboard, birthdays, team stats, `admin_delete_devotee`, `handle_new_user`, `handle_new_user_role`, `set_updated_at`, …)
- `rls_policies.sql` — every RLS policy on `public.*`

### Storage
- `storage_manifest.csv` — manifest of all 86 files across `profile-photos` and `sadhna-images` buckets (bucket, path, owner, size, mime, timestamps). Public URL pattern:
  `https://wfwimdmeovowqhqjduop.supabase.co/storage/v1/object/public/<bucket>/<name>`
  Use the included `download_storage.sh` to pull every file locally.

## Tables you asked about that DON'T EXIST in this project
These were never created in the database:
- `community_posts`
- `community_comments`
- `community_likes`
- `announcements`
- `seva_tasks`

Nothing to export for them.

## Auth users (`auth.users`, `auth.identities`)

The Lovable Cloud Postgres role does **not** have permission to read the `auth` schema directly, so I cannot dump `auth.users` / `auth.identities` from here. **Email + phone are already mirrored into `profiles.csv`**, which is enough to recreate accounts in your new project.

Recommended path: in your **new** Supabase project, use the Admin API to invite each profile by email (`supabase.auth.admin.inviteUserByEmail`). Then run the SQL in `import.sql` (below) to relink rows — match on email, then UPDATE the `user_id` / `id` columns to the new auth UUIDs.

If you need raw `auth.users` rows (password hashes, identities, etc.), that requires the service-role key on this project, which Lovable does not expose. The only way to get it is to contact Lovable support and request an auth dump for project ref `wfwimdmeovowqhqjduop`.

## Import order into your new Supabase project
1. Run `enums.sql`
2. Run `schema.sql`
3. Run `functions.sql`
4. Create users via Admin API (or import an auth dump if you obtain one)
5. Load CSVs in this order (FK-safe): `profiles` → `user_roles` → `hierarchy_nodes` → `sadhna_entries` → `todo_items` → `vaishnav_events`
6. Run `rls_policies.sql`
7. Create the two storage buckets (`profile-photos`, `sadhna-images`) as **public**, then re-upload files from the storage download.
