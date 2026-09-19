/* ==========================================================================
   내부 로그인 (S 판매운영자 / P 생산자)
   --------------------------------------------------------------------------
   ⚠ 프로토타입 목업입니다. 계정은 아래 고정값이며 sessionStorage 로만 유지됩니다.
     실제 구축 시 서버 인증 + 역할 기반 권한(설계도 11장)으로 교체합니다.
   ========================================================================== */
(function () {
  'use strict';
  const KEY = 'songsan.staff.v1';

  /* 데모 계정 — 화면 안내문에도 그대로 노출된다 */
  const ACCOUNTS = {
    manager: { pw: 'songsan2026', role: 's', name: '판매운영자', home: 'index.html' },
    farmer:  { pw: 'songsan2026', role: 'p', name: '생산자',     home: 'index.html' }
  };

  const Staff = {
    login(id, pw) {
      const a = ACCOUNTS[(id || '').trim().toLowerCase()];
      if (!a || a.pw !== pw) throw new Error('아이디 또는 비밀번호가 올바르지 않습니다.');
      try { sessionStorage.setItem(KEY, JSON.stringify({ id: id.trim().toLowerCase(), role: a.role, name: a.name })); } catch (e) {}
      return a;
    },
    current() { try { return JSON.parse(sessionStorage.getItem(KEY)); } catch (e) { return null; } },
    logout() { try { sessionStorage.removeItem(KEY); } catch (e) {} },

    /** 페이지 상단에서 호출 — 권한이 없으면 로그인 화면으로 보낸다 */
    guard(role, loginPath) {
      const u = Staff.current();
      if (!u) { location.replace(loginPath + '?next=' + encodeURIComponent(location.pathname.split('/').pop())); return null; }
      if (u.role !== role) {
        alert('이 화면에 접근할 권한이 없습니다. (' + u.name + ' 계정)');
        location.replace(loginPath);
        return null;
      }
      return u;
    }
  };

  window.SONGSAN_STAFF = Staff;
})();
