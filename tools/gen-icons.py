# -*- coding: utf-8 -*-
"""앱 아이콘 생성 — 무광 블랙 바탕에 샴페인 골드 각인.

  python tools/gen-icons.py

  web/assets/img/icon/ 에 PWA·iOS·파비콘 세트를 만든다.
  모티프: 얇은 금선 원(수확 회차) + 명조 '송' + 아래 포도알 세 개(한정 생산).
"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "web" / "assets" / "img" / "icon"
OUT.mkdir(parents=True, exist_ok=True)

BG = (13, 13, 13)
GOLD = (212, 175, 55)
WINE = (100, 13, 42)

FONTS = [r"C:\Windows\Fonts\batang.ttc", r"C:\Windows\Fonts\BATANG.TTC",
         r"C:\Windows\Fonts\gulim.ttc", r"C:\Windows\Fonts\malgun.ttf"]


def load_font(size):
    for f in FONTS:
        if Path(f).exists():
            try:
                return ImageFont.truetype(f, size)
            except Exception:
                continue
    return ImageFont.load_default()


def draw_icon(px, *, padding_ratio=0.0, rounded=True, wine_glow=True):
    """padding_ratio > 0 이면 maskable 용으로 안전영역을 둔다."""
    S = px * 4                      # 4배로 그린 뒤 축소 (안티앨리어싱)
    im = Image.new("RGB", (S, S), BG)
    d = ImageDraw.Draw(im)

    if wine_glow:                   # 아래쪽에서 올라오는 버건디 글로우
        span = int(S * 0.62)
        for i in range(span):
            t = 1 - i / span                      # 아래가 가장 짙고 위로 가며 사라진다
            c = tuple(int(BG[k] + (WINE[k] - BG[k]) * (t ** 2.4) * 0.5) for k in range(3))
            d.line([(0, S - i), (S, S - i)], fill=c)

    pad = S * padding_ratio
    box = (pad, pad, S - pad, S - pad)
    inner = (box[2] - box[0])

    # 얇은 금선 원
    r = inner * 0.36
    cx, cy = S / 2, S / 2 - inner * 0.03
    d.ellipse([cx - r, cy - r, cx + r, cy + r], outline=GOLD, width=max(2, int(S * 0.006)))
    # 바깥쪽 아주 옅은 보조선
    r2 = r * 1.13
    d.ellipse([cx - r2, cy - r2, cx + r2, cy + r2],
              outline=(int(GOLD[0] * .28), int(GOLD[1] * .28), int(GOLD[2] * .28)),
              width=max(1, int(S * 0.002)))

    # 명조 '송'
    f = load_font(int(inner * 0.40))
    tb = d.textbbox((0, 0), "송", font=f)
    d.text((cx - (tb[2] - tb[0]) / 2 - tb[0], cy - (tb[3] - tb[1]) / 2 - tb[1]), "송", font=f, fill=GOLD)

    # 포도알 세 개 — 한정 생산
    dot = inner * 0.016
    gap = inner * 0.055
    by = cy + r + inner * 0.085
    for k in (-1, 0, 1):
        d.ellipse([cx + k * gap - dot, by - dot, cx + k * gap + dot, by + dot], fill=GOLD)

    if rounded:                     # 모서리 라운드 (설계도 17.4 — 과하지 않게)
        mask = Image.new("L", (S, S), 0)
        ImageDraw.Draw(mask).rounded_rectangle([0, 0, S, S], radius=int(S * 0.21), fill=255)
        out = Image.new("RGB", (S, S), (0, 0, 0))
        out.paste(im, mask=mask)
        im = Image.composite(im, Image.new("RGB", (S, S), (0, 0, 0)), mask)
        im.putalpha(mask)

    return im.resize((px, px), Image.LANCZOS)


def save(img, name):
    p = OUT / name
    img.save(p)
    print(f"  {name:<26} {p.stat().st_size / 1024:6.1f}KB")


print("아이콘 생성 →", OUT)

# PWA
save(draw_icon(192), "icon-192.png")
save(draw_icon(512), "icon-512.png")
# maskable: 원형 크롭을 견디도록 안전영역을 크게, 모서리는 각지게(플랫폼이 깎음)
save(draw_icon(512, padding_ratio=0.14, rounded=False).convert("RGB"), "icon-maskable-512.png")
# iOS 홈 화면 (투명 없이 꽉 찬 사각)
save(draw_icon(180, rounded=False).convert("RGB"), "apple-touch-icon.png")
# 파비콘
save(draw_icon(32, rounded=False), "favicon-32.png")
save(draw_icon(16, rounded=False), "favicon-16.png")

ico = draw_icon(64, rounded=False).convert("RGBA")
ico.save(ROOT / "web" / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
print(f"  favicon.ico                {(ROOT / 'web' / 'favicon.ico').stat().st_size / 1024:6.1f}KB")

print("완료.")
