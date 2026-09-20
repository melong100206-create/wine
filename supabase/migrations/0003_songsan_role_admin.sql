-- ============================================================================
-- 송산언덕 포도원 · 최고관리자의 역할 지정 기능
-- 0001, 0002 를 실행한 뒤 SQL Editor 에 붙여넣고 Run 하십시오.
--
-- 규칙
--   · 가입한 회원 중에서 판매운영자(s) · 생산자(p) 를 지정한다.
--   · 지정 권한은 최고관리자(admin)만 가진다. 서버에서 확인하므로 화면을 조작해도 소용없다.
--   · 자기 자신의 권한은 바꿀 수 없다 (최고관리자가 스스로를 내려 시스템이 잠기는 것을 막는다).
-- ============================================================================

-- ── 현재 접속자가 최고관리자인가 ────────────────────────────────────────────
-- security definer 로 두어 songsan_staff 의 RLS 를 거치지 않는다(정책 재귀 방지).
create or replace function public.songsan_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.songsan_staff
    where id = auth.uid() and role = 'admin' and active
  );
$$;

revoke execute on function public.songsan_is_admin() from public, anon;
grant  execute on function public.songsan_is_admin() to authenticated;

-- ── 회원 목록 (최고관리자 전용) ─────────────────────────────────────────────
create or replace function public.songsan_members()
returns table (
  id        uuid,
  email     text,
  name      text,
  tel       text,
  joined_at timestamptz,
  role      text,
  active    boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.songsan_is_admin() then
    raise exception '최고관리자만 회원 목록을 볼 수 있습니다';
  end if;

  return query
    select u.id,
           coalesce(u.email, '')::text,
           coalesce(p.name, '')::text,
           coalesce(p.tel, '')::text,
           u.created_at,
           s.role,
           coalesce(s.active, false)
    from auth.users u
    left join public.songsan_profiles p on p.id = u.id
    left join public.songsan_staff    s on s.id = u.id
    order by (s.role is null), u.created_at desc;
end;
$$;

revoke execute on function public.songsan_members() from public, anon;
grant  execute on function public.songsan_members() to authenticated;

-- ── 역할 지정 / 해제 (최고관리자 전용) ──────────────────────────────────────
-- p_role: 'admin' | 's' | 'p' | null(또는 'none') = 권한 해제
create or replace function public.songsan_set_role(
  p_user uuid,
  p_role text,
  p_name text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  target_email text;
begin
  if not public.songsan_is_admin() then
    raise exception '최고관리자만 권한을 지정할 수 있습니다';
  end if;

  if p_user = auth.uid() then
    raise exception '자기 자신의 권한은 바꿀 수 없습니다';
  end if;

  select u.email into target_email from auth.users u where u.id = p_user;
  if target_email is null then
    raise exception '존재하지 않는 회원입니다';
  end if;

  if p_role is null or p_role = 'none' then
    delete from public.songsan_staff where id = p_user;
    return target_email || ' · 내부 권한 해제';
  end if;

  if p_role not in ('admin', 's', 'p') then
    raise exception '역할은 admin / s / p 중 하나여야 합니다';
  end if;

  insert into public.songsan_staff (id, role, name)
  values (p_user, p_role,
          coalesce(nullif(trim(p_name), ''), split_part(target_email, '@', 1)))
  on conflict (id) do update
    set role   = excluded.role,
        name   = coalesce(nullif(trim(p_name), ''), public.songsan_staff.name),
        active = true;

  return target_email || ' → ' ||
         case p_role when 'admin' then '최고관리자' when 's' then '판매운영자' else '생산자' end;
end;
$$;

revoke execute on function public.songsan_set_role(uuid, text, text) from public, anon;
grant  execute on function public.songsan_set_role(uuid, text, text) to authenticated;

-- ── 최고관리자는 내부 계정 목록을 볼 수 있다 ────────────────────────────────
drop policy if exists songsan_staff_admin_read on public.songsan_staff;
create policy songsan_staff_admin_read on public.songsan_staff
  for select to authenticated using (public.songsan_is_admin());
-- 쓰기 정책은 여전히 없다 → 표 직접 수정은 불가, 위 함수를 통해서만 바뀐다
