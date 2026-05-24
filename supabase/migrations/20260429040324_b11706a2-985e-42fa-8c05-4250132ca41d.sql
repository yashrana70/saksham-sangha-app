-- Fix search_path on set_updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin new.updated_at = now(); return new; end; $$;

-- Revoke public execute on SECURITY DEFINER triggers (they still run as triggers)
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- Tighten storage listing: only owners can list their own folder; reads still public
drop policy if exists "Profile photos public read" on storage.objects;
drop policy if exists "Sadhna images public read" on storage.objects;

create policy "Profile photos owner list" on storage.objects for select
using (bucket_id = 'profile-photos' and (
  auth.role() = 'anon' and false
  or auth.uid()::text = (storage.foldername(name))[1]
));

create policy "Sadhna images owner list" on storage.objects for select
using (bucket_id = 'sadhna-images' and auth.uid()::text = (storage.foldername(name))[1]);
