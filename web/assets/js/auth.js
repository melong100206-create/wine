/* ==========================================================================
   계정 (X 공통) — 프로토타입 인증
   --------------------------------------------------------------------------
   ⚠ 브라우저 localStorage 에만 저장되는 목업입니다. 실제 구축 시에는
     서버 세션/JWT + 통신사 본인인증(PASS)으로 교체합니다. (설계도 11장 권한)
     비밀번호는 목업이라도 평문으로 두지 않고 salt + SHA-256 해시로 보관합니다.
   ========================================================================== */
(function () {
  'use strict';
  const S = window.SONGSAN;
  const UKEY = 'songsan.users.v1';
  const SKEY = 'songsan.session.v1';

  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };

  /** salt + SHA-256 (crypto.subtle 이 없는 환경에서는 약식 해시로 폴백) */
  async function hash(pw, salt) {
    const data = salt + '::' + pw;
    if (window.crypto && crypto.subtle && crypto.subtle.digest) {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(data));
      return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
    }
    let h = 0;
    for (let i = 0; i < data.length; i++) { h = (h * 31 + data.charCodeAt(i)) | 0; }
    return 'fallback-' + (h >>> 0).toString(16);
  }

  const salt = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

  /** 만 나이 */
  function ageOf(birth) {
    const b = new Date(birth + 'T00:00:00');
    if (isNaN(b)) return -1;
    const now = new Date();
    let age = now.getFullYear() - b.getFullYear();
    const m = now.getMonth() - b.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
    return age;
  }

  const Auth = {
    users: () => read(UKEY, {}),

    current() {
      const email = read(SKEY, null);
      if (!email) return null;
      const u = Auth.users()[email];
      if (!u) return null;
      const { pwHash, salt: _s, ...safe } = u;   // 해시는 밖으로 내보내지 않는다
      return safe;
    },

    async signup(form) {
      const email = (form.email || '').trim().toLowerCase();
      if (!form.name || !form.name.trim()) throw new Error('이름을 입력해 주세요.');
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('이메일 형식을 확인해 주세요.');
      if (!form.pw || form.pw.length < 8) throw new Error('비밀번호는 8자 이상이어야 합니다.');
      if (form.pw !== form.pw2) throw new Error('비밀번호가 서로 다릅니다.');
      if (!/^01[016-9]-?\d{3,4}-?\d{4}$/.test((form.tel || '').replace(/\s/g, '')))
        throw new Error('휴대전화 번호를 확인해 주세요.');
      const age = ageOf(form.birth);
      if (age < 0) throw new Error('생년월일을 입력해 주세요.');
      if (age < 19) throw new Error('만 19세 미만은 주류를 구매할 수 없어 가입이 제한됩니다.');
      if (!form.agreeTerms) throw new Error('필수 약관에 동의해 주세요.');

      const users = Auth.users();
      if (users[email]) throw new Error('이미 가입된 이메일입니다.');

      const s = salt();
      users[email] = {
        email,
        name: form.name.trim(),
        tel: form.tel.trim(),
        birth: form.birth,
        zip: '', addr: '', addr2: '',
        marketing: !!form.marketing,
        salt: s,
        pwHash: await hash(form.pw, s),
        createdAt: new Date().toISOString(),
        orders: []
      };
      write(UKEY, users);
      write(SKEY, email);
      try { sessionStorage.setItem('songsan.age', 'y'); } catch (e) {}  // 가입 시 성인 확인 완료
      return Auth.current();
    },

    async login(email, pw) {
      email = (email || '').trim().toLowerCase();
      const u = Auth.users()[email];
      if (!u) throw new Error('가입되지 않은 이메일입니다.');
      if (await hash(pw, u.salt) !== u.pwHash) throw new Error('비밀번호가 일치하지 않습니다.');
      write(SKEY, email);
      try { sessionStorage.setItem('songsan.age', 'y'); } catch (e) {}
      return Auth.current();
    },

    logout() { try { localStorage.removeItem(SKEY); } catch (e) {} },

    /** 배송지 등 프로필 갱신 */
    update(patch) {
      const cur = read(SKEY, null);
      if (!cur) return null;
      const users = Auth.users();
      users[cur] = Object.assign({}, users[cur], patch, { email: cur });
      write(UKEY, users);
      return Auth.current();
    },

    /** 주문 적립 — 로그인 상태에서만 기록된다 */
    addOrder(order) {
      const cur = read(SKEY, null);
      if (!cur) return false;
      const users = Auth.users();
      users[cur].orders = [order].concat(users[cur].orders || []);
      write(UKEY, users);
      return true;
    },

    orders() { const u = Auth.current(); return (u && u.orders) || []; },

    ageOf
  };

  S.Auth = Auth;
})();
