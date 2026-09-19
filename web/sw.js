/* ==========================================================================
   송산언덕 포도원 · 서비스 워커
   화면은 네트워크 우선(최신 재고·출고일이 중요), 정적 자산은 캐시 우선.
   오프라인이면 offline.html 로 안내한다.
   ========================================================================== */
const VERSION = 'songsan-v1';
const SHELL = VERSION + '-shell';
const RUNTIME = VERSION + '-runtime';

/* 설치 시 미리 받아 두는 앱 셸 — 상대경로라 하위 경로(/wine/) 배포에서도 동작한다 */
const PRECACHE = [
  './',
  'index.html',
  'products.html',
  'product.html',
  'cart.html',
  'checkout.html',
  'account.html',
  'login.html',
  'story.html',
  'experience.html',
  'offline.html',
  'manifest.webmanifest',
  'assets/css/base.css',
  'assets/css/consumer.css',
  'assets/js/data.js',
  'assets/js/card.js',
  'assets/js/auth.js',
  'assets/js/site.js',
  'assets/img/icon/icon-192.png',
  'assets/img/icon/icon-512.png',
  'assets/img/photo/hero.webp'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SHELL)
      .then((c) => Promise.allSettled(PRECACHE.map((u) => c.add(u))))   // 하나 실패해도 설치는 진행
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== SHELL && k !== RUNTIME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;          // 폰트 등 외부 자원은 브라우저에 맡긴다

  /* 화면 이동: 네트워크 우선 → 실패 시 캐시 → 그래도 없으면 오프라인 안내 */
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(RUNTIME).then((c) => c.put(req, copy));
          return res;
        })
        .catch(() => caches.match(req).then((hit) => hit || caches.match('offline.html')))
    );
    return;
  }

  /* 정적 자산: 캐시 우선 + 백그라운드 갱신 */
  e.respondWith(
    caches.match(req).then((hit) => {
      const net = fetch(req).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(RUNTIME).then((c) => c.put(req, copy));
        }
        return res;
      }).catch(() => hit);
      return hit || net;
    })
  );
});
