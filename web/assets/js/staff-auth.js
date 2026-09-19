/* ==========================================================================
   내부 로그인 (S 판매운영자 / P 생산자) — Supabase Auth + 역할 테이블
   --------------------------------------------------------------------------
   · 인증은 소비자와 같은 Supabase Auth 를 쓰되, public.songsan_staff 에
     행이 있는 계정만 내부 화면에 들어올 수 있다.
   · 역할 부여는 SQL Editor 전용 함수(songsan_grant_staff)로만 가능하다.
     songsan_staff 에는 select 정책만 있어 브라우저에서 스스로 권한을 만들 수 없다.
   ========================================================================== */
(function () {
  'use strict';

  const CFG = (window.SONGSAN && window.SONGSAN.supabase) || {};
  const ROLE_NAME = { admin: '최고관리자', s: '판매운영자', p: '생산자' };

  let client = null;
  let staff = null;          // { id, role, name }
  let readyResolve;

  const Staff = {
    available: false,
    ready: new Promise((r) => { readyResolve = r; }),
    roleName: (r) => ROLE_NAME[r] || r
  };
  window.SONGSAN_STAFF = Staff;

  /* 보호 화면(<html data-guard>)만 확인이 끝날 때까지 가린다 — 로그인 화면은 그대로 보여야 한다 */
  if (document.documentElement.hasAttribute('data-guard')) {
    document.documentElement.classList.add('staff-checking');
  }
  const unveil = () => document.documentElement.classList.remove('staff-checking');

  function humanize(err) {
    const m = (err && (err.message || err.error_description)) || '';
    if (/Invalid login credentials/i.test(m)) return '아이디(이메일) 또는 비밀번호가 올바르지 않습니다.';
    if (/Email not confirmed/i.test(m)) return '이메일 인증이 끝나지 않은 계정입니다.';
    if (/rate limit|too many/i.test(m)) return '요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.';
    if (/Failed to fetch|NetworkError/i.test(m)) return '서버에 연결하지 못했습니다.';
    return m || '알 수 없는 오류가 발생했습니다.';
  }

  async function loadStaff(session) {
    staff = null;
    if (!session || !session.user) return;
    const { data, error } = await client
      .from('songsan_staff').select('id, role, name, active').eq('id', session.user.id).maybeSingle();
    if (error) { console.warn('[songsan] 권한 조회 실패', error.message); return; }
    if (data && data.active) staff = { id: data.id, role: data.role, name: data.name, email: session.user.email };
  }

  Staff.current = () => staff;

  Staff.login = async function (email, pw) {
    if (!Staff.available) throw new Error('인증 서버에 연결할 수 없습니다.');
    const { data, error } = await client.auth.signInWithPassword({
      email: (email || '').trim().toLowerCase(), password: pw
    });
    if (error) throw new Error(humanize(error));

    await loadStaff(data.session);
    if (!staff) {                                   // 로그인은 됐지만 내부 권한이 없는 계정
      await client.auth.signOut();
      throw new Error('내부 시스템에 접근할 수 있는 계정이 아닙니다. 운영 담당자에게 권한을 요청하십시오.');
    }
    return staff;
  };

  Staff.logout = async function () {
    if (client) await client.auth.signOut();
    staff = null;
  };

  /** 보호 화면 상단에서 호출 — 권한이 없으면 로그인 화면으로 보낸다 */
  Staff.guard = async function (role, loginPath) {
    await Staff.ready;
    if (!staff) {
      location.replace(loginPath + '?next=' + encodeURIComponent(location.pathname.split('/').pop()));
      return null;
    }
    /* 최고관리자는 판매운영자·생산자 화면 모두 볼 수 있다 */
    if (staff.role !== role && staff.role !== 'admin') {
      alert('이 화면에 접근할 권한이 없습니다. (' + Staff.roleName(staff.role) + ' 계정으로 로그인되어 있습니다)');
      location.replace(loginPath);
      return null;
    }
    unveil();
    return staff;
  };

  async function init() {
    if (!window.supabase && document.readyState === 'loading') {
      await new Promise((r) => addEventListener('DOMContentLoaded', r, { once: true }));
    }
    const ok = CFG.url && CFG.key && CFG.key.indexOf('PASTE') === -1 && window.supabase;
    if (!ok) {
      console.warn('[songsan] Supabase 설정 없음 — 내부 로그인 불가');
      readyResolve(null); unveil(); return;
    }
    try {
      client = window.supabase.createClient(CFG.url, CFG.key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false }
      });
      Staff.available = true;
      Staff.client = client;
      const { data } = await client.auth.getSession();
      await loadStaff(data.session);
    } catch (e) {
      console.warn('[songsan] 내부 인증 초기화 실패', e);
    }
    readyResolve(staff);
  }

  init();
})();
