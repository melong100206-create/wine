/* ==========================================================================
   계정 (X 공통) — Supabase Auth
   --------------------------------------------------------------------------
   · 인증: Supabase Auth (이메일 + 비밀번호). 비밀번호는 서버에서만 다룬다.
   · 데이터: public.songsan_profiles / public.songsan_orders, 접근 제어는 RLS.
   · 만 19세 확인: 가입 폼에서 한 번, DB 트리거(songsan_enforce_adult)에서 다시 한 번.
   · 설정이 없거나 네트워크가 끊기면 S.Auth.available = false 로 두고
     사이트의 나머지 기능(둘러보기·장바구니·비회원 주문)은 그대로 동작시킨다.
   ========================================================================== */
(function () {
  'use strict';
  const S = window.SONGSAN;
  const CFG = S.supabase || {};

  let client = null;
  let authUser = null;      // supabase auth user
  let profile = null;       // songsan_profiles row
  let readyResolve;

  const Auth = {
    available: false,
    ready: new Promise((r) => { readyResolve = r; })
  };
  S.Auth = Auth;

  const emit = () => dispatchEvent(new CustomEvent('songsan:auth', { detail: Auth.current() }));

  /* ── 오류 메시지 한국어화 ─────────────────────────────────── */
  function humanize(err) {
    const m = (err && (err.message || err.error_description)) || '';
    if (/Invalid login credentials/i.test(m)) return '이메일 또는 비밀번호가 올바르지 않습니다.';
    if (/Email not confirmed/i.test(m)) return '이메일 인증이 아직 끝나지 않았습니다. 메일함을 확인해 주세요.';
    if (/User already registered|already been registered/i.test(m)) return '이미 가입된 이메일입니다.';
    if (/Password should be at least/i.test(m)) return '비밀번호는 8자 이상이어야 합니다.';
    if (/rate limit|too many/i.test(m)) return '요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.';
    if (/만 19세 미만/.test(m)) return '만 19세 미만은 가입할 수 없습니다.';
    if (/생년월일/.test(m)) return '생년월일을 입력해 주세요.';
    if (/Failed to fetch|NetworkError/i.test(m)) return '서버에 연결하지 못했습니다. 네트워크를 확인해 주세요.';
    return m || '알 수 없는 오류가 발생했습니다.';
  }

  /* ── 만 나이 ──────────────────────────────────────────────── */
  function ageOf(birth) {
    const b = new Date(birth + 'T00:00:00');
    if (isNaN(b)) return -1;
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
    return age;
  }
  Auth.ageOf = ageOf;

  /* ── 세션 → 프로필 ────────────────────────────────────────── */
  async function loadProfile() {
    profile = null;
    if (!authUser) return;

    const { data, error } = await client
      .from('songsan_profiles').select('*').eq('id', authUser.id).maybeSingle();
    if (error) { console.warn('[songsan] 프로필 조회 실패', error.message); return; }

    if (data) { profile = data; return; }

    /* 메일 인증 후 첫 로그인 등 프로필이 아직 없는 경우 — 가입 시 저장한 메타데이터로 만든다 */
    const meta = authUser.user_metadata || {};
    const { data: made, error: insErr } = await client.from('songsan_profiles').insert({
      id: authUser.id,
      email: authUser.email || '',
      name: meta.name || '',
      tel: meta.tel || '',
      birth: meta.birth || null,
      marketing: meta.marketing === true || meta.marketing === 'true'
    }).select().maybeSingle();

    if (insErr) { console.warn('[songsan] 프로필 생성 실패', insErr.message); return; }
    profile = made;
  }

  async function applySession(session) {
    authUser = (session && session.user) || null;
    await loadProfile();
  }

  /* ── 공개 API ─────────────────────────────────────────────── */
  Auth.current = function () {
    if (!authUser) return null;
    const p = profile || {};
    return {
      id: authUser.id,
      email: authUser.email || p.email || '',
      name: p.name || (authUser.user_metadata || {}).name || '',
      tel: p.tel || '',
      birth: p.birth || null,
      zip: p.zip || '',
      addr: p.addr || '',
      addr2: p.addr2 || '',
      marketing: !!p.marketing,
      createdAt: p.created_at || authUser.created_at,
      profileReady: !!profile
    };
  };

  Auth.signup = async function (form) {
    if (!Auth.available) throw new Error('지금은 회원가입 서버에 연결할 수 없습니다.');

    const email = (form.email || '').trim().toLowerCase();
    const name = (form.name || '').trim();
    const tel = (form.tel || '').trim();

    if (!name) throw new Error('이름을 입력해 주세요.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('이메일 형식을 확인해 주세요.');
    if (!form.pw || form.pw.length < 8) throw new Error('비밀번호는 8자 이상이어야 합니다.');
    if (form.pw !== form.pw2) throw new Error('비밀번호가 서로 다릅니다.');
    if (!/^01[016-9]-?\d{3,4}-?\d{4}$/.test(tel.replace(/\s/g, ''))) throw new Error('휴대전화 번호를 확인해 주세요.');
    const age = ageOf(form.birth);
    if (age < 0) throw new Error('생년월일을 입력해 주세요.');
    if (age < 19) throw new Error('만 19세 미만은 주류를 구매할 수 없어 가입이 제한됩니다.');
    if (!form.agreeTerms) throw new Error('필수 약관에 동의해 주세요.');

    const redirect = location.origin + location.pathname.replace(/[^/]*$/, '') + 'login.html';
    const { data, error } = await client.auth.signUp({
      email,
      password: form.pw,
      options: {
        emailRedirectTo: redirect,
        data: { app: 'songsan', name: name, tel: tel, birth: form.birth, marketing: !!form.marketing }
      }
    });
    if (error) throw new Error(humanize(error));

    /* 이미 가입된 이메일이면 Supabase 가 빈 identities 로 응답한다 */
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      throw new Error('이미 가입된 이메일입니다.');
    }

    if (data.session) {                       // 이메일 확인이 꺼져 있으면 바로 로그인된다
      await applySession(data.session);
      try { sessionStorage.setItem('songsan.age', 'y'); } catch (e) {}
      emit();
      return { status: 'active', user: Auth.current() };
    }
    return { status: 'confirm', email: email };   // 인증 메일 발송됨
  };

  Auth.login = async function (email, pw) {
    if (!Auth.available) throw new Error('지금은 로그인 서버에 연결할 수 없습니다.');
    const { data, error } = await client.auth.signInWithPassword({
      email: (email || '').trim().toLowerCase(), password: pw
    });
    if (error) throw new Error(humanize(error));
    await applySession(data.session);
    try { sessionStorage.setItem('songsan.age', 'y'); } catch (e) {}
    emit();
    return Auth.current();
  };

  Auth.logout = async function () {
    if (client) await client.auth.signOut();
    authUser = null; profile = null;
    emit();
  };

  Auth.resetPassword = async function (email) {
    if (!Auth.available) throw new Error('지금은 서버에 연결할 수 없습니다.');
    const redirect = location.origin + location.pathname.replace(/[^/]*$/, '') + 'login.html';
    const { error } = await client.auth.resetPasswordForEmail((email || '').trim().toLowerCase(), {
      redirectTo: redirect
    });
    if (error) throw new Error(humanize(error));
    return true;
  };

  Auth.update = async function (patch) {
    if (!authUser) return null;
    const row = Object.assign({}, patch, { id: authUser.id, email: authUser.email || '' });
    if (!row.birth && profile && profile.birth) row.birth = profile.birth;   // 트리거가 생년월일을 요구한다
    const { data, error } = await client
      .from('songsan_profiles').upsert(row).select().maybeSingle();
    if (error) throw new Error(humanize(error));
    profile = data;
    emit();
    return Auth.current();
  };

  Auth.addOrder = async function (order) {
    if (!authUser) return false;            // 비회원 주문은 계정에 남기지 않는다
    const { error } = await client.from('songsan_orders').insert({
      user_id: authUser.id,
      order_no: order.no,
      summary: order.summary,
      bottles: order.bottles,
      total: order.total,
      ship_date: order.shipDate || null,
      status: order.status || '결제완료',
      recipient: order.recipient || null
    });
    if (error) { console.warn('[songsan] 주문 저장 실패', error.message); return false; }
    return true;
  };

  Auth.orders = async function () {
    if (!authUser) return [];
    const { data, error } = await client
      .from('songsan_orders').select('*').order('created_at', { ascending: false });
    if (error) { console.warn('[songsan] 주문 조회 실패', error.message); return []; }
    return (data || []).map((o) => ({
      no: o.order_no,
      summary: o.summary,
      bottles: o.bottles,
      total: o.total,
      status: o.status,
      shipDate: o.ship_date,
      at: o.created_at
    }));
  };

  /* ── 초기화 ───────────────────────────────────────────────── */
  async function init() {
    /* SDK 는 head 에서 defer 로 받으므로 문서 파싱이 끝난 뒤에야 준비된다 */
    if (!window.supabase && document.readyState === 'loading') {
      await new Promise((r) => addEventListener('DOMContentLoaded', r, { once: true }));
    }
    const ok = CFG.url && CFG.key && CFG.key.indexOf('PASTE') === -1 && window.supabase;
    if (!ok) {
      console.warn('[songsan] Supabase 설정 또는 SDK 없음 — 로그인 기능이 꺼진 상태로 동작합니다.');
      readyResolve(null); emit(); return;
    }
    try {
      client = window.supabase.createClient(CFG.url, CFG.key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, flowType: 'pkce' }
      });
      Auth.available = true;
      Auth.client = client;

      const { data } = await client.auth.getSession();
      await applySession(data.session);

      client.auth.onAuthStateChange(async (_evt, session) => {
        await applySession(session);
        emit();
      });
    } catch (e) {
      console.warn('[songsan] Supabase 초기화 실패', e);
      Auth.available = false;
    }
    readyResolve(Auth.current());
    emit();
  }

  init();
})();
