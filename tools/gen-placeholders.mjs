/**
 * 플레이스홀더 비주얼 생성기
 * ---------------------------------------------------------------
 * 설계도 Q11(전문 포토그래퍼 섭외) 확정 전까지 사용할 임시 시각자료를 SVG로 생성한다.
 * 실사 촬영본이 준비되면 web/assets/img/ 안의 동일 파일명 .jpg/.webp 로 교체하고
 * HTML의 <img src> 확장자만 바꾸면 된다.
 *
 * 실행:  node tools/gen-placeholders.mjs
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '..', 'web', 'assets', 'img');
mkdirSync(OUT, { recursive: true });

const GOLD = '#D4AF37';
const write = (name, svg) => {
  writeFileSync(resolve(OUT, name), svg.trim() + '\n', 'utf8');
  console.log('  ·', name);
};

const grain = (id) => `
  <filter id="${id}">
    <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" stitchTiles="stitch"/>
    <feColorMatrix type="saturate" values="0"/>
    <feComponentTransfer><feFuncA type="linear" slope="0.055"/></feComponentTransfer>
  </filter>`;

/* ── 병 누끼 (핀 조명) ───────────────────────────────────────── */
const bottle = ({ glass = '#2B0A16', label = '#0E0E0E', accent = GOLD, name = 'SONGSAN', sub = 'CAMPBELL EARLY', cap = '#640D2A' }) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000" role="img">
  <defs>
    <radialGradient id="spot" cx="50%" cy="34%" r="62%">
      <stop offset="0%" stop-color="#3a3a3a"/><stop offset="45%" stop-color="#141414"/><stop offset="100%" stop-color="#050505"/>
    </radialGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#000"/><stop offset="22%" stop-color="${glass}"/>
      <stop offset="48%" stop-color="#5E1228"/><stop offset="70%" stop-color="${glass}"/><stop offset="100%" stop-color="#050505"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff" stop-opacity=".30"/><stop offset="60%" stop-color="#fff" stop-opacity=".02"/><stop offset="100%" stop-color="#fff" stop-opacity="0"/>
    </linearGradient>
    <linearGradient id="floor" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#5E1228" stop-opacity=".30"/><stop offset="100%" stop-color="#5E1228" stop-opacity="0"/>
    </linearGradient>
    ${grain('g1')}
  </defs>
  <rect width="800" height="1000" fill="url(#spot)"/>
  <ellipse cx="400" cy="892" rx="196" ry="26" fill="#000" opacity=".72"/>
  <g>
    <path d="M356 122h88v146c0 34 18 44 41 74 25 32 37 70 37 116v400c0 22-16 34-38 34H316c-22 0-38-12-38-34V458c0-46 12-84 37-116 23-30 41-40 41-74V122z" fill="url(#glass)"/>
    <rect x="352" y="96" width="96" height="42" rx="3" fill="${cap}"/>
    <rect x="352" y="96" width="96" height="42" rx="3" fill="none" stroke="${accent}" stroke-opacity=".5"/>
    <path d="M356 150h88v118h-88z" fill="#000" opacity=".22"/>
    <path d="M330 470c0-40 10-72 30-98v520h-30z" fill="url(#sheen)"/>
    <rect x="300" y="540" width="200" height="252" fill="${label}"/>
    <rect x="300" y="540" width="200" height="252" fill="none" stroke="${accent}" stroke-opacity=".55"/>
    <rect x="312" y="552" width="176" height="228" fill="none" stroke="${accent}" stroke-opacity=".22"/>
    <text x="400" y="622" text-anchor="middle" font-family="Georgia, serif" font-size="13" letter-spacing="7" fill="${accent}">SONGSAN HILL</text>
    <line x1="344" y1="642" x2="456" y2="642" stroke="${accent}" stroke-opacity=".45"/>
    <text x="400" y="686" text-anchor="middle" font-family="Georgia, serif" font-size="26" letter-spacing="5" fill="#F2F2F2">${name}</text>
    <text x="400" y="722" text-anchor="middle" font-family="monospace" font-size="10" letter-spacing="4" fill="#A6A6A6">${sub}</text>
    <text x="400" y="762" text-anchor="middle" font-family="monospace" font-size="9" letter-spacing="3" fill="#6E6E6E">KOREA · 750ml</text>
  </g>
  <ellipse cx="400" cy="900" rx="150" ry="60" fill="url(#floor)"/>
  <rect width="800" height="1000" filter="url(#g1)" opacity=".5"/>
</svg>`;

/* ── 전용 패키지 박스 (매트 블랙) ────────────────────────────── */
const box = ({ accent = GOLD, name = 'CAMPBELL EARLY' }) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 1000" width="800" height="1000" role="img">
  <defs>
    <radialGradient id="s2" cx="50%" cy="40%" r="66%">
      <stop offset="0%" stop-color="#2E2E2E"/><stop offset="55%" stop-color="#121212"/><stop offset="100%" stop-color="#040404"/>
    </radialGradient>
    <linearGradient id="lid" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#252525"/><stop offset="50%" stop-color="#171717"/><stop offset="100%" stop-color="#0B0B0B"/>
    </linearGradient>
    <linearGradient id="side" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#0A0A0A"/><stop offset="100%" stop-color="#1C1C1C"/>
    </linearGradient>
    ${grain('g2')}
  </defs>
  <rect width="800" height="1000" fill="url(#s2)"/>
  <ellipse cx="400" cy="806" rx="250" ry="34" fill="#000" opacity=".7"/>
  <g>
    <path d="M196 336l204-84 204 84-204 86z" fill="url(#lid)"/>
    <path d="M196 336v336l204 116V422z" fill="url(#side)"/>
    <path d="M604 336v336L400 788V422z" fill="#0D0D0D"/>
    <path d="M196 336l204-84 204 84-204 86z" fill="none" stroke="${accent}" stroke-opacity=".35"/>
    <path d="M196 336v336l204 116V422zM604 336v336L400 788" fill="none" stroke="${accent}" stroke-opacity=".18"/>
    <g opacity=".9">
      <text x="400" y="336" text-anchor="middle" font-family="Georgia, serif" font-size="17" letter-spacing="9" fill="${accent}">송산언덕</text>
      <text x="400" y="364" text-anchor="middle" font-family="monospace" font-size="9" letter-spacing="5" fill="#8C8C8C">${name}</text>
    </g>
    <rect x="248" y="486" width="112" height="70" fill="none" stroke="${accent}" stroke-opacity=".3"/>
    <text x="304" y="524" text-anchor="middle" font-family="monospace" font-size="8" letter-spacing="3" fill="${accent}">GOLD FOIL</text>
    <text x="304" y="540" text-anchor="middle" font-family="monospace" font-size="7" letter-spacing="2" fill="#7A7A7A">TASTING CARD</text>
  </g>
  <rect width="800" height="1000" filter="url(#g2)" opacity=".5"/>
</svg>`;

/* ── 시네마틱 배경 (포도밭 야경 / 연출 컷) ───────────────────── */
const scene = ({ hue = '#5E1228', tone = '#0B0B0B', label = '', rows = 9, ratio = [1600, 900] }) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ratio[0]} ${ratio[1]}" width="${ratio[0]}" height="${ratio[1]}" role="img" preserveAspectRatio="xMidYMid slice">
  <defs>
    <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${tone}"/><stop offset="52%" stop-color="${hue}" stop-opacity=".55"/><stop offset="100%" stop-color="#040404"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="28%" r="52%">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity=".22"/><stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
    ${grain('g3')}
  </defs>
  <rect width="${ratio[0]}" height="${ratio[1]}" fill="url(#sky)"/>
  <rect width="${ratio[0]}" height="${ratio[1]}" fill="url(#glow)"/>
  <g stroke="#000" stroke-opacity=".55" fill="none">
    ${Array.from({ length: rows }, (_, i) => {
      const y = ratio[1] * (0.52 + (i / rows) * 0.52);
      const s = 1 + i * 0.5;
      return `<path d="M-100 ${y} Q ${ratio[0] / 2} ${y - 40 - i * 6} ${ratio[0] + 100} ${y}" stroke-width="${s}"/>`;
    }).join('\n    ')}
  </g>
  <g fill="#000" opacity=".82">
    ${Array.from({ length: 14 }, (_, i) => {
      const x = (i / 13) * ratio[0];
      const h = ratio[1] * (0.18 + ((i * 37) % 11) / 60);
      return `<rect x="${x - 3}" y="${ratio[1] - h}" width="6" height="${h}"/>`;
    }).join('\n    ')}
  </g>
  <rect width="${ratio[0]}" height="${ratio[1]}" fill="url(#g-none)"/>
  ${label ? `<text x="${ratio[0] / 2}" y="${ratio[1] - 34}" text-anchor="middle" font-family="monospace" font-size="13" letter-spacing="6" fill="#6E6E6E">${label}</text>` : ''}
  <rect width="${ratio[0]}" height="${ratio[1]}" filter="url(#g3)" opacity=".55"/>
</svg>`;

/* ── 장인정신 컷 (흑백/세피아) ───────────────────────────────── */
const craft = ({ label = '', warm = '#2A1B12' }) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 1500" width="1200" height="1500" role="img" preserveAspectRatio="xMidYMid slice">
  <defs>
    <radialGradient id="c1" cx="46%" cy="34%" r="70%">
      <stop offset="0%" stop-color="#6B5843"/><stop offset="42%" stop-color="${warm}"/><stop offset="100%" stop-color="#070605"/>
    </radialGradient>
    ${grain('g4')}
  </defs>
  <rect width="1200" height="1500" fill="url(#c1)"/>
  <!-- 항아리 실루엣 -->
  <g fill="#0A0806" opacity=".86">
    <path d="M600 470c150 0 250 120 250 300s-112 300-250 300-250-120-250-300 100-300 250-300z"/>
    <rect x="520" y="424" width="160" height="60" rx="8"/>
  </g>
  <g fill="none" stroke="#C9A227" stroke-opacity=".28">
    <path d="M600 470c150 0 250 120 250 300s-112 300-250 300-250-120-250-300 100-300 250-300z"/>
    <path d="M410 700h380M430 860h340"/>
  </g>
  <ellipse cx="600" cy="1108" rx="290" ry="40" fill="#000" opacity=".6"/>
  ${label ? `<text x="600" y="1420" text-anchor="middle" font-family="monospace" font-size="20" letter-spacing="10" fill="#9E8A6B">${label}</text>` : ''}
  <rect width="1200" height="1500" filter="url(#g4)" opacity=".6"/>
</svg>`;

/* ── 페어링 연출 컷 ──────────────────────────────────────────── */
const plate = ({ tint = '#1A1A1A', label = '' }) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 800" width="1000" height="800" role="img" preserveAspectRatio="xMidYMid slice">
  <defs>
    <radialGradient id="p1" cx="50%" cy="38%" r="64%">
      <stop offset="0%" stop-color="#333"/><stop offset="48%" stop-color="${tint}"/><stop offset="100%" stop-color="#060606"/>
    </radialGradient>
    ${grain('g5')}
  </defs>
  <rect width="1000" height="800" fill="url(#p1)"/>
  <ellipse cx="500" cy="470" rx="250" ry="170" fill="#0B0B0B"/>
  <ellipse cx="500" cy="470" rx="250" ry="170" fill="none" stroke="${GOLD}" stroke-opacity=".28"/>
  <ellipse cx="500" cy="462" rx="150" ry="98" fill="#141414"/>
  <ellipse cx="500" cy="452" rx="96" ry="58" fill="#3A1220" opacity=".9"/>
  <ellipse cx="500" cy="452" rx="96" ry="58" fill="none" stroke="${GOLD}" stroke-opacity=".2"/>
  ${label ? `<text x="500" y="742" text-anchor="middle" font-family="monospace" font-size="15" letter-spacing="7" fill="#7E7E7E">${label}</text>` : ''}
  <rect width="1000" height="800" filter="url(#g5)" opacity=".5"/>
</svg>`;

console.log('placeholder 생성 →', OUT);

write('bottle-campbell.svg', bottle({ name: 'CAMPBELL', sub: 'CAMPBELL EARLY · DRY' }));
write('bottle-mba.svg',      bottle({ name: 'M · B · A', sub: 'MUSCAT BAILEY A · MEDIUM', glass: '#1E0712', cap: '#4A0A20' }));
write('bottle-jar.svg',      bottle({ name: '열흘의 원칙', sub: 'ONGGI FERMENTED · LIMITED', glass: '#241019', cap: '#2E2E2E' }));
write('bottle-rose.svg',     bottle({ name: 'ROSÉ', sub: 'CAMPBELL ROSÉ · SEMI-SWEET', glass: '#4A1626', cap: '#7A1F3A' }));

write('box-campbell.svg', box({ name: 'CAMPBELL EARLY' }));
write('box-mba.svg',      box({ name: 'MUSCAT BAILEY A' }));
write('box-jar.svg',      box({ name: 'ONGGI · LIMITED 300' }));
write('box-rose.svg',     box({ name: 'CAMPBELL ROSÉ' }));

write('hero.svg',       scene({ label: 'SONGSAN HILL VINEYARD · MIDNIGHT HARVEST' }));
write('scene-farm.svg', scene({ hue: '#33121F', label: 'PRIVATE VINEYARD TOUR', rows: 7 }));
write('scene-wide.svg', scene({ hue: '#2A1020', label: '', rows: 11, ratio: [1600, 1000] }));

write('craft-onggi.svg',  craft({ label: 'ONGGI FERMENTATION' }));
write('craft-hands.svg',  craft({ label: 'TEN DAYS PRINCIPLE', warm: '#22201C' }));

write('pair-1.svg', plate({ label: 'AGED HANWOO · CHARCOAL' }));
write('pair-2.svg', plate({ tint: '#171A18', label: 'JEJU DUCK CONFIT' }));
write('pair-3.svg', plate({ tint: '#1B1616', label: 'AGED CHEESE & FIG' }));

console.log('완료.');
