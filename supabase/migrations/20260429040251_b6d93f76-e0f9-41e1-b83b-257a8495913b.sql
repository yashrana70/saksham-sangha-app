-- PROFILES
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  phone text,
  whatsapp text,
  devotee_level text,
  facilitator_name text,
  spiritual_friend_name text,
  gender text,
  dob date,
  education text,
  profession text,
  marital_status text,
  address text,
  photo_url text,
  family jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

create policy "Profiles select own" on public.profiles for select using (auth.uid() = id);
create policy "Profiles insert own" on public.profiles for insert with check (auth.uid() = id);
create policy "Profiles update own" on public.profiles for update using (auth.uid() = id);

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger profiles_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, phone, devotee_level, facilitator_name)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email,
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'devotee_level',
    new.raw_user_meta_data->>'facilitator_name'
  );
  return new;
end; $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- SADHNA ENTRIES
create table public.sadhna_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  entry_date date not null default current_date,
  japa_rounds integer default 0,
  hearing_minutes integer default 0,
  reading_minutes integer default 0,
  seva_minutes integer default 0,
  association_minutes integer default 0,
  wake_up_time time,
  sleep_time time,
  notes text,
  facilitator_name text,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.sadhna_entries enable row level security;
create policy "Sadhna select own" on public.sadhna_entries for select using (auth.uid() = user_id);
create policy "Sadhna insert own" on public.sadhna_entries for insert with check (auth.uid() = user_id);
create policy "Sadhna update own" on public.sadhna_entries for update using (auth.uid() = user_id);
create policy "Sadhna delete own" on public.sadhna_entries for delete using (auth.uid() = user_id);
create trigger sadhna_updated_at before update on public.sadhna_entries
for each row execute function public.set_updated_at();
create index sadhna_user_date_idx on public.sadhna_entries(user_id, entry_date desc);

-- VAISHNAV EVENTS (shared, read-only for users)
create table public.vaishnav_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_date date not null,
  event_type text,
  description text,
  created_at timestamptz not null default now()
);
alter table public.vaishnav_events enable row level security;
create policy "Events readable by authenticated" on public.vaishnav_events
for select to authenticated using (true);
create index vaishnav_events_date_idx on public.vaishnav_events(event_date);

-- STORAGE BUCKETS
insert into storage.buckets (id, name, public) values ('profile-photos', 'profile-photos', true);
insert into storage.buckets (id, name, public) values ('sadhna-images', 'sadhna-images', true);

create policy "Profile photos public read" on storage.objects for select using (bucket_id = 'profile-photos');
create policy "Profile photos user upload" on storage.objects for insert
with check (bucket_id = 'profile-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Profile photos user update" on storage.objects for update
using (bucket_id = 'profile-photos' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Profile photos user delete" on storage.objects for delete
using (bucket_id = 'profile-photos' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Sadhna images public read" on storage.objects for select using (bucket_id = 'sadhna-images');
create policy "Sadhna images user upload" on storage.objects for insert
with check (bucket_id = 'sadhna-images' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Sadhna images user update" on storage.objects for update
using (bucket_id = 'sadhna-images' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "Sadhna images user delete" on storage.objects for delete
using (bucket_id = 'sadhna-images' and auth.uid()::text = (storage.foldername(name))[1]);
