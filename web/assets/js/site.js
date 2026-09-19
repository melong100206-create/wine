/* ==========================================================================
   송산언덕 포도원 · 공통 스크립트
   헤더/푸터 주입 · 장바구니(localStorage) · 스크롤 연출 · 성인인증
   ========================================================================== */
(function () {
  'use strict';
  const S = window.SONGSAN;
  const BASE = document.body.dataset.base || './';
  S.base = BASE;

  /* ── 유틸 ─────────────────────────────────────────────────── */
  const won = (n) => n.toLocaleString('ko-KR');
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /** 실사(AI/촬영) 이미지 우선, 없으면 SVG 플레이스홀더로 자동 폴백 */
  function img(photo, svg, alt, cls) {
    const p = photo ? `${BASE}assets/img/photo/${photo}.webp` : `${BASE}assets/img/${svg}`;
    const fb = `${BASE}assets/img/${svg}`;
    return `<img class="${cls || ''}" src="${p}" alt="${alt || ''}" loading="lazy" decoding="async"
      onerror="this.onerror=null;this.src='${fb}'">`;
  }
  S.won = won; S.img = img; S.$ = $; S.$$ = $$; S.el = el;

  /* ── 장바구니 ─────────────────────────────────────────────── */
  const KEY = 'songsan.cart.v1';
  const Cart = {
    read() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { return []; } },
    write(items) { try { localStorage.setItem(KEY, JSON.stringify(items)); } catch (e) {} paintCount(); },
    add(id, qty) {
      const items = Cart.read();
      const hit = items.find((i) => i.id === id);
      if (hit) hit.qty += qty; else items.push({ id, qty });
      Cart.write(items);
      toast(`장바구니에 담았습니다 · ${qty}병`);
    },
    setQty(id, qty) {
      const items = Cart.read().map((i) => (i.id === id ? { ...i, qty: Math.max(1, qty) } : i));
      Cart.write(items);
    },
    remove(id) { Cart.write(Cart.read().filter((i) => i.id !== id)); },
    clear() { Cart.write([]); },
    detailed() {
      return Cart.read().map((i) => {
        const p = S.products.find((x) => x.id === i.id);
        return p ? { ...i, product: p, line: p.price * i.qty } : null;
      }).filter(Boolean);
    },
    totals() {
      const rows = Cart.detailed();
      const bottles = rows.reduce((a, r) => a + r.qty, 0);
      const subtotal = rows.reduce((a, r) => a + r.line, 0);
      const ship = bottles === 0 || bottles >= S.shipping.freeFrom ? 0 : S.shipping.fee;
      return { rows, bottles, subtotal, ship, total: subtotal + ship };
    }
  };
  S.Cart = Cart;

  /** 로그인 상태에 따라 헤더 우측을 바꾼다 */
  function paintAccount() {
    const slot = $('#account-slot');
    if (!slot) return;
    const u = S.Auth && S.Auth.current();
    slot.innerHTML = u
      ? `<a class="user-chip" href="${BASE}account.html" title="마이페이지"><i class="dot"></i><span class="u-name">${u.name} 님</span></a>`
      : `<a class="user-chip" href="${BASE}login.html">로그인</a>`;
  }
  S.paintAccount = paintAccount;

  function paintCount() {
    const n = Cart.read().reduce((a, i) => a + i.qty, 0);
    $$('.cart-count').forEach((c) => { c.textContent = n; c.dataset.empty = n === 0; });
  }

  /* ── 토스트 ───────────────────────────────────────────────── */
  let toastEl, toastT;
  function toast(msg) {
    if (!toastEl) { toastEl = el('<div class="toast" role="status"></div>'); document.body.appendChild(toastEl); }
    toastEl.textContent = msg;
    toastEl.classList.add('show');
    clearTimeout(toastT);
    toastT = setTimeout(() => toastEl.classList.remove('show'), 2400);
  }
  S.toast = toast;

  /* ── 헤더 / 푸터 ──────────────────────────────────────────── */
  const NAV = [
    ['products.html', '와인'],
    ['experience.html', '체험농장'],
    ['story.html', '농장 이야기'],
    ['#contact', '문의']
  ];

  function mountHeader() {
    const here = location.pathname.split('/').pop() || 'index.html';
    const nav = NAV.map(([href, label]) => {
      const to = href.startsWith('#') ? BASE + 'index.html' + href : BASE + href;
      const cur = href === here ? ' aria-current="page"' : '';
      return `<a href="${to}"${cur}>${label}</a>`;
    }).join('');

    document.body.prepend(el(`
      <header class="site-header">
        <a class="brandmark" href="${BASE}index.html">
          <span>
            <span class="bm-ko">송산언덕</span>
            <span class="bm-en">SONGSAN HILL VINEYARD</span>
          </span>
        </a>
        <nav class="nav">${nav}</nav>
        <div class="header-actions">
          <span id="install-slot"></span>
          <span id="account-slot"></span>
          <a class="cart-btn" href="${BASE}cart.html">장바구니 <span class="cart-count" data-empty="true">0</span></a>
          <button class="menu-toggle" aria-label="메뉴"><span></span><span></span></button>
        </div>
      </header>`));

    $('.menu-toggle').addEventListener('click', () => document.body.classList.toggle('nav-open'));
    $$('.nav a').forEach((a) => a.addEventListener('click', () => document.body.classList.remove('nav-open')));

    paintAccount();
    addEventListener('songsan:auth', paintAccount);   // 세션이 준비되거나 바뀌면 다시 그린다

    const hdr = $('.site-header');
    const onScroll = () => hdr.classList.toggle('scrolled', window.scrollY > 40);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  function mountFooter() {
    const b = S.brand;
    document.body.appendChild(el(`
      <footer class="site-footer" id="contact">
        <div class="wrap">
          <div class="footer-grid">
            <div>
              <div class="bm-ko" style="font-family:var(--font-head);font-size:19px;letter-spacing:.3em">송산언덕</div>
              <p class="small" style="margin-top:18px;max-width:34ch">${b.claim}.<br>수확 회차마다 만든 만큼만 내어 드립니다.</p>
              <div class="age-warn" style="margin-top:26px">19 · 미성년자에게 판매하지 않습니다</div>
            </div>
            <div>
              <h4>Shop</h4>
              <div class="footer-list">
                <a href="${BASE}products.html">와인 목록</a>
                <a href="${BASE}experience.html">체험농장 예약</a>
                <a href="${BASE}cart.html">장바구니</a>
                <a href="${BASE}story.html">농장 이야기</a>
              </div>
            </div>
            <div>
              <h4>Operation</h4>
              <div class="footer-list">
                <a href="${BASE}admin/login.html">판매운영자 콘솔</a>
                <a href="${BASE}admin/login.html">생산자 발주 화면</a>
                <span class="dim small">내부용 · 로그인 필요</span>
              </div>
            </div>
            <div>
              <h4>App</h4>
              <div class="footer-list">
                <span class="small">홈 화면에 추가하면 앱처럼 전체 화면으로 열리고, 한 번 본 화면은 오프라인에서도 보입니다.</span>
                <span class="dim xsmall">iPhone · Safari 공유 <b>⇧</b> → 홈 화면에 추가</span>
                <span class="dim xsmall">Android · Chrome 메뉴 → 앱 설치</span>
              </div>
            </div>
            <div>
              <h4>Contact</h4>
              <div class="footer-list">
                <p>${b.addr}</p>
                <p class="num">${b.tel}</p>
                <p>${b.email}</p>
                <p class="dim">${b.hours}</p>
              </div>
            </div>
          </div>
          <div class="legal-note">
            ${b.bizName} · 대표 ${b.owner} · 사업자등록번호 ${b.bizNo} · 통신판매업신고 ${b.mailOrderNo} · ${b.liquorNo}<br>
            주류는 「주세법」상 지역특산주에 한해 통신판매가 허용되며, 주문 시 성인인증과 수령인 성인 확인(배송 시 신분증 대조)이 이루어집니다.
            과도한 음주는 뇌졸중, 기억력 손상이나 치매를 유발합니다. 임신 중 음주는 기형아 출생 위험을 높입니다.<br>
            © 2026 ${b.nameEn}. 사진·문안 무단 전재 금지.
          </div>
        </div>
      </footer>`));
  }

  /* ── 스크롤 연출 ──────────────────────────────────────────── */
  let revealIO;
  function reveal() {
    if (!revealIO) {
      revealIO = new IntersectionObserver((es) => {
        es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); revealIO.unobserve(e.target); } });
      }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    }
    $$('[data-reveal]:not(.in)').forEach((n) => revealIO.observe(n));
  }

  function parallax() {
    const nodes = $$('[data-parallax]');
    if (!nodes.length || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let tick = false;
    const run = () => {
      const vh = innerHeight;
      nodes.forEach((n) => {
        const r = n.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        const p = (r.top + r.height / 2 - vh / 2) / vh;
        n.style.transform = `translate3d(0, ${(p * (parseFloat(n.dataset.parallax) || 30) * -1).toFixed(2)}px, 0)`;
      });
      tick = false;
    };
    addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(run); } }, { passive: true });
    run();
  }

  /* 게이지 애니메이션 (테이스팅 노트) */
  function gauges() {
    const io = new IntersectionObserver((es) => {
      es.forEach((e) => {
        if (!e.isIntersecting) return;
        $$('.g-fill', e.target).forEach((f) => { f.style.width = (Number(f.dataset.v) / 5 * 100) + '%'; });
        io.unobserve(e.target);
      });
    }, { threshold: 0.4 });
    $$('.gauge').forEach((g) => io.observe(g));
  }

  S.reveal = reveal; S.gauges = gauges; S.parallax = parallax;

  /* ── 성인인증 (X 공통 · 최초 진입 1회) ─────────────────────── */
  function ageGate() {
    let ok = false;
    try { ok = sessionStorage.getItem('songsan.age') === 'y'; } catch (e) { ok = false; }
    if (ok) return;
    const gate = el(`
      <div class="agegate" role="dialog" aria-modal="true" aria-label="성인 인증">
        <div class="agegate-box">
          <div class="eyebrow center" style="justify-content:center">AGE VERIFICATION</div>
          <h2 class="t-h2" style="margin:26px 0 18px">만 19세 이상이십니까?</h2>
          <p class="muted small" style="max-width:36ch;margin:0 auto">
            주류를 판매하는 사이트입니다. 「청소년 보호법」에 따라 만 19세 미만에게는 판매하지 않으며,
            결제 단계에서 본인인증이 한 번 더 진행됩니다.
          </p>
          <div class="row" style="justify-content:center;margin-top:36px;gap:12px">
            <button class="btn btn-primary" data-yes>예, 19세 이상입니다</button>
            <button class="btn" data-no>아니오</button>
          </div>
        </div>
      </div>`);
    document.body.appendChild(gate);
    document.body.style.overflow = 'hidden';
    gate.querySelector('[data-yes]').onclick = () => {
      try { sessionStorage.setItem('songsan.age', 'y'); } catch (e) {}
      gate.remove(); document.body.style.overflow = '';
    };
    gate.querySelector('[data-no]').onclick = () => {
      gate.querySelector('.agegate-box').innerHTML =
        '<h2 class="t-h3">만 19세 미만은 이용할 수 없습니다.</h2>' +
        '<p class="muted small" style="margin-top:18px">이용해 주셔서 감사합니다.</p>';
    };
  }

  /* ── D-day ────────────────────────────────────────────────── */
  S.ddayText = function () {
    const d = new Date(S.nextShipDate + 'T00:00:00');
    const diff = Math.ceil((d - new Date()) / 86400000);
    const md = `${d.getMonth() + 1}월 ${d.getDate()}일`;
    return diff > 0 ? `${md} 출고 · D-${diff}` : `${md} 출고`;
  };

  /* ── 도로명 주소 검색 (다음 우편번호 서비스) ───────────────── */
  const POSTCODE_SRC = 'https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js';
  let postcodeLoading = null;

  function loadPostcode() {
    if (window.daum && window.daum.Postcode) return Promise.resolve(true);
    if (postcodeLoading) return postcodeLoading;
    postcodeLoading = new Promise((resolve) => {
      const sc = document.createElement('script');
      sc.src = POSTCODE_SRC;
      sc.async = true;
      sc.onload = () => resolve(!!(window.daum && window.daum.Postcode));
      sc.onerror = () => resolve(false);
      document.head.appendChild(sc);
    });
    return postcodeLoading;
  }

  /**
   * 주소 검색창을 띄우고 고른 결과를 돌려준다.
   * @param {(addr:{zip:string, road:string, jibun:string, extra:string}) => void} onPick
   */
  S.findAddress = async function (onPick) {
    const ok = await loadPostcode();
    if (!ok) { toast('주소 검색을 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.'); return false; }

    /* 팝업창은 차단되거나 설치형 앱에서 어색하므로 페이지 안에 얹는다 */
    const modal = el(`
      <div class="addr-modal" role="dialog" aria-modal="true" aria-label="도로명 주소 검색">
        <div class="addr-modal-box">
          <div class="addr-modal-head">
            <span class="eyebrow">Address</span>
            <button class="addr-close" aria-label="닫기">닫기 ✕</button>
          </div>
          <div class="addr-modal-body"></div>
        </div>
      </div>`);
    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    const close = () => {
      modal.remove();
      document.body.style.overflow = '';
      removeEventListener('keydown', onKey);
    };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    addEventListener('keydown', onKey);
    modal.querySelector('.addr-close').addEventListener('click', close);
    modal.addEventListener('click', (e) => { if (e.target === modal) close(); });

    new window.daum.Postcode({
      width: '100%',
      height: '100%',
      oncomplete: (d) => {
        const extra = d.buildingName ? ' (' + d.buildingName + ')' : '';
        onPick({
          zip: d.zonecode,
          road: (d.roadAddress || d.address) + extra,
          jibun: d.jibunAddress || '',
          extra: extra
        });
        close();
      }
    }).embed(modal.querySelector('.addr-modal-body'), { autoClose: false });

    return true;
  };

  /** 우편번호/주소 입력칸 한 쌍을 검색 버튼과 묶는다 */
  S.bindAddressSearch = function (opts) {
    const btn = $('#' + opts.button);
    const zip = $('#' + opts.zip);
    const addr = $('#' + opts.addr);
    const detail = opts.detail ? $('#' + opts.detail) : null;
    if (!btn || !zip || !addr) return;

    zip.readOnly = true; addr.readOnly = true;
    zip.placeholder = '검색'; addr.placeholder = '주소 검색을 눌러 주세요';

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      S.findAddress((a) => {
        zip.value = a.zip;
        addr.value = a.road;
        if (detail) { detail.value = ''; detail.focus(); }
        zip.dispatchEvent(new Event('change', { bubbles: true }));
        addr.dispatchEvent(new Event('change', { bubbles: true }));
      });
    });
  };

  /* ── 앱 설치 (PWA) ────────────────────────────────────────── */
  function initApp() {
    /* 서비스 워커 — file:// 로 열었을 때는 등록하지 않는다 */
    if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
      addEventListener('load', function () {
        navigator.serviceWorker.register(BASE + 'sw.js', { scope: BASE })
          .catch(function () { /* 등록 실패해도 사이트는 그대로 동작한다 */ });
      });
    }

    /* 설치 버튼은 브라우저가 설치 가능하다고 알려줄 때만 나타난다 */
    let deferred = null;
    addEventListener('beforeinstallprompt', function (e) {
      e.preventDefault();
      deferred = e;
      const slot = $('#install-slot');
      if (!slot) return;
      slot.innerHTML = '<button class="install-btn" title="홈 화면에 설치">앱 설치</button>';
      slot.querySelector('button').addEventListener('click', async function () {
        slot.innerHTML = '';
        deferred.prompt();
        const res = await deferred.userChoice;
        deferred = null;
        if (res && res.outcome === 'accepted') toast('홈 화면에 추가했습니다');
      });
    });
    addEventListener('appinstalled', function () {
      const slot = $('#install-slot');
      if (slot) slot.innerHTML = '';
      toast('앱이 설치되었습니다');
    });
  }

  /* ── 부팅 ─────────────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', () => {
    if (!document.body.hasAttribute('data-bare')) { mountHeader(); mountFooter(); }
    paintCount(); reveal(); parallax(); gauges(); initApp();
    if (!document.body.hasAttribute('data-no-agegate')) ageGate();
  });
})();
