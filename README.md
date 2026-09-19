# 송산언덕 포도원 · 홈페이지 프로토타입

「송산언덕 포도원 홈페이지 및 주문·발주·정산 운영시스템 설계도 v2.0」의 **소비자 화면(C) 전면**과
**내부 화면(S·P) 목업**을 구현한 정적 프로토타입입니다. 빌드 도구 없이 브라우저에서 바로 열립니다.

## 실행

```bash
python -m http.server 5173 --directory web
```

`http://localhost:5173` 접속. (파일을 직접 더블클릭해도 동작하지만, 로컬 서버로 여는 편이 폰트·이미지 로딩이 안정적입니다.)

## 화면 구성

| 설계도 | 파일 | 내용 |
|---|---|---|
| C-01 홈 | `web/index.html` | 풀블리드 시네마틱 히어로(영상 슬롯 + 실사 poster), 출고 D-day, 시차 스크롤 상품 카드, 초청장형 체험농장, 페이드인 브랜드 스토리 |
| C-02 상품 목록 | `web/products.html` | 다크 갤러리 뷰, hover 시 패키징 이미지로 크로스페이드, 가격보다 품종·테이스팅을 앞세운 타이포 |
| C-03 상품 상세 | `web/product.html?id=…` | 갤러리 + 금색 게이지 테이스팅 노트 + 페어링 + 장인정신 스토리 + 법정 표시사항 아코디언 + 모바일 글래스모피즘 구매 바 |
| C-04 장바구니 | `web/cart.html` | localStorage 기반 수량·삭제·합계 |
| C-05 체험농장 | `web/experience.html` | 3개 프로그램 + 예약 요청 폼 |
| C-06 농장 이야기 | `web/story.html` | '싸게 판다'가 아닌 '가장 온전한 상태로 보낸다'는 워딩 |
| C-07~09 주문·결제 | `web/checkout.html`, `web/order-complete.html` | 3단계 스테퍼, 미니멀 폼, 필수 동의, 주문번호 발급 |
| X 공통 | `web/assets/js/site.js` | 성인인증 게이트(세션 1회), 헤더/푸터, 토스트, 스크롤 연출 |
| S 판매운영자 | `web/admin/index.html` | 라이트 모드. 주문 상태 전이, 회차 발주서 확정, 스냅샷 정산표 |
| P 생산자 | `web/producer/index.html` | 라이트 모드. "오늘 담을 것"만 표시 — 가격·고객정보 비노출, 완료 체크 한 번 |

## 디자인 시스템 (설계도 17장 그대로)

- 색: `#0D0D0D` / `#1A1A1A` / `#640D2A` / `#D4AF37` / `#F2F2F2` / `#A6A6A6` → `web/assets/css/base.css` 의 CSS 변수
- 타이포: 표제 나눔명조(넓은 자간) · 본문 Pretendard · 숫자 IBM Plex Mono
- 곡률 2px, 1px 실선 구분, 일반 쇼핑몰 대비 1.5~2배 여백
- 소비자 화면은 다크 강제, 관리자·생산자 화면은 라이트

## 이미지

- `web/assets/img/photo/*.webp` — 실사 이미지(로컬 ComfyUI/Flux 생성 후 WebP 변환). 히어로·병 4종·패키지 2종·발효실·수확·페어링 3컷 등 15컷. 원본 PNG는 `photo/_src/`에 함께 보관(재인코딩용).
- `web/assets/img/*.svg` — 폴백. 위 WebP가 없으면 자동으로 이 SVG가 표시됩니다(`site.js`의 `img()`).
- 재생성: `node tools/gen-placeholders.mjs` (SVG) / `python tools/queue_and_harvest.py submit tools/scenes.left-pair.json` → 렌더 후 `harvest` → `python tools/optimize-photos.py` (실사)
- **전문 촬영본이 준비되면**(설계도 Q11) 같은 파일명의 .webp 로 덮어쓰면 코드 수정 없이 교체됩니다. (PNG를 넣고 `python tools/optimize-photos.py` 를 돌리면 변환됩니다.)
- 히어로 영상: `web/assets/video/hero.mp4` 를 넣으면 자동 재생되고, 없으면 poster 이미지가 노출됩니다.

## 프로토타입 범위 (아직 없는 것)

- 실제 결제(PG) 연동 — `checkout.html`은 폼 검증까지만 하고 주문번호를 만듭니다.
- 서버·DB·API — 상품/프로그램 데이터는 `web/assets/js/data.js` 에 하드코딩. 실제 구축 시 `GET /products` 등으로 교체.
- 본인인증(성인인증)은 세션 모달만. 실제로는 결제 단계의 통신사·PASS 인증이 필요합니다.
- 관리자·생산자 화면의 상태 전이는 화면 내 메모리에서만 동작합니다(새로고침 시 초기화).

## 법적 전제

주류 통신판매는 「주세법」상 **지역특산주(농민이 직접 생산한 농산물로 제조)** 에 한해 허용됩니다.
이 프로토타입은 그 전제로 성인인증·성인 수령 확인·경고 문구·법정 표시사항 영역을 모두 포함해 두었습니다.
실제 오픈 전 면허 구분(지역특산주 제조면허 여부)과 통신판매 가능 범위를 반드시 확인하십시오. (설계도 15장)
