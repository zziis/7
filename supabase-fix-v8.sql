-- ZILZAL v8.1 — Patch for the CURRENT profiles schema
-- Current columns confirmed: id, display_name, avatar_url, points, role, banned,
-- created_at, username, public_id, contact_email, inviter_id, reward_ready_at.
-- Run ONCE in Supabase > SQL Editor.

-- Optional account fields. Safe if already present.
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists phone_verified boolean not null default false;

-- Daily butterfly reward: +50 points, once every 24 hours.
create or replace function public.claim_butterfly_reward()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.profiles%rowtype;
begin
  if auth.uid() is null then
    raise exception 'يجب تسجيل الدخول';
  end if;

  select * into p
  from public.profiles
  where id = auth.uid()
  for update;

  if p.id is null then
    raise exception 'الحساب غير موجود';
  end if;

  if p.reward_ready_at is not null and p.reward_ready_at > now() then
    raise exception 'المكافأة غير جاهزة بعد';
  end if;

  update public.profiles
     set points = coalesce(points,0) + 50,
         reward_ready_at = now() + interval '24 hours'
   where id = auth.uid()
   returning * into p;

  return jsonb_build_object(
    'points', p.points,
    'reward_ready_at', p.reward_ready_at,
    'reward', 50
  );
end;
$$;

grant execute on function public.claim_butterfly_reward() to authenticated;

-- Secure profile editing. ID / points / role are never editable here.
create or replace function public.update_my_profile(
  p_name text,
  p_contact_email text default null,
  p_avatar_url text default null
)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  p public.profiles%rowtype;
  clean_name text;
begin
  if auth.uid() is null then
    raise exception 'يجب تسجيل الدخول';
  end if;

  clean_name := trim(coalesce(p_name,''));
  if length(clean_name) < 1 or length(clean_name) > 40 then
    raise exception 'اسم الحساب غير صالح';
  end if;

  update public.profiles
     set display_name = clean_name,
         username = clean_name,
         contact_email = nullif(trim(coalesce(p_contact_email,'')),''),
         avatar_url = nullif(trim(coalesce(p_avatar_url,'')),'')
   where id = auth.uid()
   returning * into p;

  if p.id is null then
    raise exception 'الحساب غير موجود';
  end if;

  return p;
end;
$$;

grant execute on function public.update_my_profile(text,text,text) to authenticated;

-- Public profile reader: exposes public ID, public name, avatar, role and join date only.
drop function if exists public.get_public_profile(bigint);
create function public.get_public_profile(p_public_id bigint)
returns table(
  public_id bigint,
  name text,
  avatar_url text,
  role text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.public_id,
    coalesce(nullif(p.display_name,''), nullif(p.username,''), 'مستخدم') as name,
    p.avatar_url,
    p.role,
    p.created_at
  from public.profiles p
  where p.public_id = p_public_id
  limit 1
$$;

grant execute on function public.get_public_profile(bigint) to anon, authenticated;

-- Avatar bucket.
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('avatars','avatars',true,5242880,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update
set public=true,
    file_size_limit=5242880,
    allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif'];

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read"
on storage.objects for select
to anon,authenticated
using(bucket_id='avatars');

drop policy if exists "avatars_owner_insert" on storage.objects;
create policy "avatars_owner_insert"
on storage.objects for insert
to authenticated
with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);

drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update"
on storage.objects for update
to authenticated
using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text)
with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);

drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete"
on storage.objects for delete
to authenticated
using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);

notify pgrst, 'reload schema';
