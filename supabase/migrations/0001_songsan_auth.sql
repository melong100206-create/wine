-- ============================================================================
-- 송산언덕 포도원 · 로그인/주문 스키마
-- Supabase SQL Editor 에 그대로 붙여넣고 Run 하면 됩니다.
-- (프로젝트: upivpeglioedgitufzwj)
-- ============================================================================

-- ── 프로필 ──────────────────────────────────────────────────────────────────
create table if not exists public.songsan_profiles (
  id                uuid primary key references auth.users(id) on delete cascade,
  email             text        not null default '',
  name              text        not null default '',
  tel               text        not null default '',
  birth             date,
  zip               text        not null default '',
  addr              text        not null default '',
  addr2             text        not null default '',
  marketing         boolean     not null default false,
  adult_verified_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.songsan_profiles is '송산언덕 포도원 소비자 프로필 (주류 판매 — 만 19세 이상만)';

-- ── 주문 ────────────────────────────────────────────────────────────────────
create table if not exists public.songsan_orders (
  id         uuid        primary key default gen_random_uuid(),
  user_id    uuid        not null references auth.users(id) on delete cascade,
  order_no   text        not null unique,
  summary    text        not null default '',
  bottles    integer     not null check (bottles > 0),
  total      integer     not null check (total >= 0),
  ship_date  date,
  status     text        not null default '결제완료',
  recipient  jsonb,                        -- 주문 시점 수령 정보 스냅샷 (설계도 정산 원칙)
  created_at timestamptz not null default now()
);

comment on table public.songsan_orders is '송산언덕 주문 내역 — 생성 후 수정/삭제 불가(정산 스냅샷)';

create index if not exists songsan_orders_user_created_idx
  on public.songsan_orders (user_id, created_at desc);

-- ── 성인 확인: 만 19세 미만은 프로필을 만들 수 없다 ────────────────────────
create or replace function public.songsan_enforce_adult()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.birth is null then
    raise exception '생년월일이 필요합니다 (주류 판매)';
  end if;
  if date_part('year', age(current_date, new.birth)) < 19 then
    raise exception '만 19세 미만은 가입할 수 없습니다';
  end if;
  new.adult_verified_at := coalesce(new.adult_verified_at, now());
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists songsan_profiles_adult on public.songsan_profiles;
create trigger songsan_profiles_adult
  before insert or update on public.songsan_profiles
  for each row execute function public.songsan_enforce_adult();

-- ── RLS: 본인 데이터만 보고 쓴다 ────────────────────────────────────────────
alter table public.songsan_profiles enable row level security;
alter table public.songsan_orders   enable row level security;

drop policy if exists songsan_profiles_select on public.songsan_profiles;
create policy songsan_profiles_select on public.songsan_profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists songsan_profiles_insert on public.songsan_profiles;
create policy songsan_profiles_insert on public.songsan_profiles
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists songsan_profiles_update on public.songsan_profiles;
create policy songsan_profiles_update on public.songsan_profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

drop policy if exists songsan_orders_select on public.songsan_orders;
create policy songsan_orders_select on public.songsan_orders
  for select to authenticated using ((select auth.uid()) = user_id);

drop policy if exists songsan_orders_insert on public.songsan_orders;
create policy songsan_orders_insert on public.songsan_orders
  for insert to authenticated with check ((select auth.uid()) = user_id);
-- update / delete 정책 없음 = 주문 내역은 불변
