-- ZILZAL v8 — شغّل هذا الملف مرة واحدة داخل Supabase > SQL Editor
-- يصلح مكافأة الفراشة، تعديل الحساب، الصورة، ويحافظ على ID والنقاط من التعديل اليدوي.

alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists phone_verified boolean not null default false;

-- تأكد أن دالة الفراشة موجودة في Schema Cache
create or replace function public.claim_butterfly_reward()
returns jsonb language plpgsql security definer set search_path=public as $$
declare p public.profiles; inv uuid; begin
 select * into p from public.profiles where user_id=auth.uid() for update;
 if p.user_id is null then raise exception 'الحساب غير موجود'; end if;
 if p.reward_ready_at is not null and p.reward_ready_at > now() then raise exception 'المكافأة غير جاهزة بعد'; end if;
 update public.profiles set points=points+50,reward_ready_at=now()+interval '24 hours' where user_id=auth.uid() returning * into p;
 select inviter_user into inv from public.referral_rewards where invited_user=auth.uid();
 if inv is not null then update public.profiles set points=points+2 where user_id=inv; end if;
 insert into public.butterfly_claims(user_id,inviter_bonus) values(auth.uid(),case when inv is null then 0 else 2 end);
 return jsonb_build_object('points',p.points,'reward_ready_at',p.reward_ready_at,'inviter_bonus',case when inv is null then 0 else 2 end);
end $$;
grant execute on function public.claim_butterfly_reward() to authenticated;

-- تعديل آمن للحساب: لا يسمح بتغيير ID أو النقاط أو الدور.
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
  if p_name is null or length(trim(p_name)) < 1 or length(trim(p_name)) > 40 then raise exception 'اسم الحساب غير صالح'; end if;
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

-- قراءة الاسم والصورة العامة فقط لباقي المستخدمين.
create or replace function public.get_public_profile(p_public_id bigint)
returns table(public_id bigint,name text,avatar_url text,role text,created_at timestamptz)
language sql stable security definer set search_path=public as $$
  select p.public_id,p.name,p.avatar_url,p.role,p.created_at
  from public.profiles p where p.public_id=p_public_id limit 1
$$;
grant execute on function public.get_public_profile(bigint) to anon,authenticated;

-- صور الحسابات
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

-- إعادة تحميل PostgREST Schema Cache بعد إنشاء الدوال.
notify pgrst, 'reload schema';
