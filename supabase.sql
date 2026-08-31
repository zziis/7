-- ZILZAL PLATFORM v7 — accounts, IDs, points, referrals, daily butterfly, APK admin
create sequence if not exists public.zilzal_public_id_seq start 1000;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  public_id bigint unique not null,
  name text not null,
  contact_email text,
  role text not null default 'user' check (role in ('user','developer','admin')),
  points bigint not null default 0 check(points >= 0),
  inviter_id bigint references public.profiles(public_id),
  reward_ready_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists profiles_public_id_idx on public.profiles(public_id);

create table if not exists public.referral_rewards (
  invited_user uuid primary key references auth.users(id) on delete cascade,
  inviter_user uuid not null references auth.users(id) on delete cascade,
  signup_reward_paid boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.butterfly_claims (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  claimed_at timestamptz not null default now(),
  reward_points int not null default 50,
  inviter_bonus int not null default 0
);

create table if not exists public.apk_apps (
 id uuid primary key default gen_random_uuid(), name text not null, version text default '', size_text text default '', category text default 'أخرى', description text default '', icon_url text default '', download_url text not null, visible boolean not null default true, created_at timestamptz default now(), updated_at timestamptz default now()
);
create table if not exists public.apk_admins(user_id uuid primary key references auth.users(id) on delete cascade, created_at timestamptz default now());

alter table public.profiles enable row level security;
alter table public.referral_rewards enable row level security;
alter table public.butterfly_claims enable row level security;
alter table public.apk_apps enable row level security;
alter table public.apk_admins enable row level security;

drop policy if exists "profile_self" on public.profiles;
create policy "profile_self" on public.profiles for select to authenticated using(user_id=auth.uid());
drop policy if exists "apk_public_visible" on public.apk_apps;
create policy "apk_public_visible" on public.apk_apps for select to anon,authenticated using(visible=true or exists(select 1 from public.apk_admins a where a.user_id=auth.uid()));
drop policy if exists "apk_admin_insert" on public.apk_apps;
create policy "apk_admin_insert" on public.apk_apps for insert to authenticated with check(exists(select 1 from public.apk_admins a where a.user_id=auth.uid()));
drop policy if exists "apk_admin_update" on public.apk_apps;
create policy "apk_admin_update" on public.apk_apps for update to authenticated using(exists(select 1 from public.apk_admins a where a.user_id=auth.uid()));
drop policy if exists "apk_admin_delete" on public.apk_apps;
create policy "apk_admin_delete" on public.apk_apps for delete to authenticated using(exists(select 1 from public.apk_admins a where a.user_id=auth.uid()));

create or replace function public.is_apk_admin() returns boolean language sql stable security definer set search_path=public as $$ select exists(select 1 from public.apk_admins where user_id=auth.uid()) $$;
grant execute on function public.is_apk_admin() to authenticated,anon;

-- Atomic daily reward. Logging out resets reward_ready_at through auth-login Edge Function as requested.
create or replace function public.claim_butterfly_reward()
returns jsonb language plpgsql security definer set search_path=public as $$
declare p public.profiles; inv uuid; begin
 select * into p from profiles where user_id=auth.uid() for update;
 if p.user_id is null then raise exception 'الحساب غير موجود'; end if;
 if p.reward_ready_at is not null and p.reward_ready_at > now() then raise exception 'المكافأة غير جاهزة بعد'; end if;
 update profiles set points=points+50,reward_ready_at=now()+interval '24 hours' where user_id=auth.uid() returning * into p;
 select inviter_user into inv from referral_rewards where invited_user=auth.uid();
 if inv is not null then update profiles set points=points+2 where user_id=inv; end if;
 insert into butterfly_claims(user_id,inviter_bonus) values(auth.uid(),case when inv is null then 0 else 2 end);
 return jsonb_build_object('points',p.points,'reward_ready_at',p.reward_ready_at,'inviter_bonus',case when inv is null then 0 else 2 end);
end $$;
grant execute on function public.claim_butterfly_reward() to authenticated;

-- Room creation helper: change 100 to desired price.
create or replace function public.spend_room_points(room_price int default 100)
returns bigint language plpgsql security definer set search_path=public as $$ declare bal bigint; begin
 if room_price<0 then raise exception 'سعر غير صالح'; end if;
 update profiles set points=points-room_price where user_id=auth.uid() and points>=room_price returning points into bal;
 if bal is null then raise exception 'نقاطك غير كافية لإنشاء الروم'; end if; return bal; end $$;
grant execute on function public.spend_room_points(int) to authenticated;

-- IMPORTANT: developer ID 1 is created by auth-register Edge Function only when DEV_SETUP_SECRET matches.

create table if not exists public.ai_daily_usage(user_id uuid not null references auth.users(id) on delete cascade, usage_date date not null default (now() at time zone 'utc')::date, used int not null default 0, primary key(user_id,usage_date));
alter table public.ai_daily_usage enable row level security;
drop policy if exists "ai_usage_self" on public.ai_daily_usage;
create policy "ai_usage_self" on public.ai_daily_usage for select to authenticated using(user_id=auth.uid());

-- =====================================================================
-- ZILZAL v8 account fixes: profile editing, avatar, fixed ID, public card
-- =====================================================================
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists phone_verified boolean not null default false;

-- No direct UPDATE policy is granted to users. This function updates only safe fields,
-- so public_id, points, role and reward timers cannot be changed from the browser.
create or replace function public.update_my_profile(
  p_name text,
  p_contact_email text default null,
  p_avatar_url text default null
)
returns public.profiles
language plpgsql
security definer
set search_path=public
as $$
declare p public.profiles;
begin
  if auth.uid() is null then raise exception 'يجب تسجيل الدخول'; end if;
  if p_name is null or length(trim(p_name)) < 1 or length(trim(p_name)) > 40 then
    raise exception 'اسم الحساب غير صالح';
  end if;
  update public.profiles
     set name=trim(p_name),
         contact_email=nullif(trim(coalesce(p_contact_email,'')),''),
         avatar_url=nullif(trim(coalesce(p_avatar_url,'')),'')
   where user_id=auth.uid()
   returning * into p;
  if p.user_id is null then raise exception 'الحساب غير موجود'; end if;
  return p;
end $$;
grant execute on function public.update_my_profile(text,text,text) to authenticated;

-- Safe public profile lookup for showing name/avatar to other users without exposing email.
create or replace function public.get_public_profile(p_public_id bigint)
returns table(public_id bigint,name text,avatar_url text,role text,created_at timestamptz)
language sql
stable
security definer
set search_path=public
as $$
  select p.public_id,p.name,p.avatar_url,p.role,p.created_at
  from public.profiles p
  where p.public_id=p_public_id
  limit 1
$$;
grant execute on function public.get_public_profile(bigint) to anon,authenticated;

-- Avatar storage bucket (public image delivery, owner-only write access).
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('avatars','avatars',true,5242880,array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set public=true,file_size_limit=5242880,allowed_mime_types=array['image/jpeg','image/png','image/webp','image/gif'];

drop policy if exists "avatars_public_read" on storage.objects;
create policy "avatars_public_read" on storage.objects for select to anon,authenticated using(bucket_id='avatars');
drop policy if exists "avatars_owner_insert" on storage.objects;
create policy "avatars_owner_insert" on storage.objects for insert to authenticated with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "avatars_owner_update" on storage.objects;
create policy "avatars_owner_update" on storage.objects for update to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text) with check(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
drop policy if exists "avatars_owner_delete" on storage.objects;
create policy "avatars_owner_delete" on storage.objects for delete to authenticated using(bucket_id='avatars' and (storage.foldername(name))[1]=auth.uid()::text);
