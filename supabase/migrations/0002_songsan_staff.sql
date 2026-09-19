-- ============================================================================
-- 송산언덕 포도원 · 내부 계정(판매운영자 S / 생산자 P)
-- Supabase SQL Editor 에 붙여넣고 Run 하십시오. (0001 을 먼저 실행한 뒤)
-- ============================================================================

-- ── 내부 역할 테이블 ────────────────────────────────────────────────────────
-- auth.users 는 소비자와 공유하되, 이 표에 행이 있는 계정만 내부 화면에 들어갈 수 있다.
create table if not exists public.songsan_staff (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       text        not null check (role in ('admin', 's', 'p')),   -- admin: 최고관리자, s: 판매운영자, p: 생산자
  name       text        not null default '',
  active     boolean     not null default true,
  created_at timestamptz not null default now()
);

comment on table public.songsan_staff is '내부 시스템 접근 권한 — 여기 없는 계정은 관리자·생산자 화면에 들어갈 수 없다';

alter table public.songsan_staff enable row level security;

-- 본인 행만 읽을 수 있다(권한 확인용). insert/update/delete 정책은 두지 않는다
-- → 브라우저에서는 어떤 방법으로도 스스로에게 역할을 부여할 수 없다.
drop policy if exists songsan_staff_self on public.songsan_staff;
create policy songsan_staff_self on public.songsan_staff
  for select to authenticated using ((select auth.uid()) = id);

-- ── 역할 부여 함수 (SQL Editor 전용) ────────────────────────────────────────
-- 사용법:  select public.songsan_grant_staff('kds08200820@gmail.com', 'admin', '김동석');   -- 최고관리자
--         select public.songsan_grant_staff('manager@songsanhill.kr', 's', '판매운영자');
--         select public.songsan_grant_staff('farmer@songsanhill.kr',  'p', '생산자');
-- 대상 계정은 Authentication → Users → Add user 로 먼저 만들어 두어야 합니다.
create or replace function public.songsan_grant_staff(
  p_email text,
  p_role  text,
  p_name  text default ''
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid;
begin
  if p_role not in ('admin', 's', 'p') then
    raise exception '역할은 admin(최고관리자), s(판매운영자), p(생산자) 중 하나여야 합니다';
  end if;

  select u.id into uid from auth.users u where lower(u.email) = lower(trim(p_email));
  if uid is null then
    raise exception '해당 이메일의 계정이 없습니다: % (Authentication → Users 에서 먼저 만드십시오)', p_email;
  end if;

  insert into public.songsan_staff (id, role, name)
  values (uid, p_role, coalesce(nullif(trim(p_name), ''), split_part(p_email, '@', 1)))
  on conflict (id) do update
    set role = excluded.role, name = excluded.name, active = true;

  return p_email || ' → ' ||
         case p_role when 'admin' then '최고관리자' when 's' then '판매운영자' else '생산자' end;
end;
$$;

-- 브라우저(anon·authenticated)에서는 호출할 수 없게 한다 — 권한 상승 경로 차단
revoke all on function public.songsan_grant_staff(text, text, text) from public;
revoke all on function public.songsan_grant_staff(text, text, text) from anon;
revoke all on function public.songsan_grant_staff(text, text, text) from authenticated;

-- 권한 회수:  update public.songsan_staff set active = false where id = (select id from auth.users where email = '...');

-- ── 최고관리자 등록 ─────────────────────────────────────────────────────────
-- kds08200820@gmail.com 계정을 Authentication → Users 에서 먼저 만든 뒤 아래를 실행하십시오.
-- (이미 만들어 두었다면 이 줄만 실행하면 됩니다)
select public.songsan_grant_staff('kds08200820@gmail.com', 'admin', '김동석');
