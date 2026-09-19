# -*- coding: utf-8 -*-
"""생성된 실사 PNG를 웹용 WebP로 변환한다.

사용: python tools/optimize-photos.py
  web/assets/img/photo/*.png  →  같은 폴더의 *.webp (원본 PNG는 photo/_src/ 로 이동)

사이트는 .webp 를 참조하고, 없으면 assets/img/*.svg 플레이스홀더로 폴백한다(site.js 의 img()).
"""
import sys
from pathlib import Path
from PIL import Image

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
PHOTO = ROOT / "web" / "assets" / "img" / "photo"
SRC = PHOTO / "_src"
SRC.mkdir(parents=True, exist_ok=True)

QUALITY = 84
total_before = total_after = 0

for png in sorted(PHOTO.glob("*.png")):
    webp = png.with_suffix(".webp")
    im = Image.open(png).convert("RGB")
    im.save(webp, "WEBP", quality=QUALITY, method=6)
    before, after = png.stat().st_size, webp.stat().st_size
    total_before += before
    total_after += after
    png.replace(SRC / png.name)
    print(f"  {png.stem:<18} {before/1024:7.0f}KB → {after/1024:6.0f}KB  ({100*after/before:.0f}%)")

if total_before:
    print(f"합계 {total_before/1024:.0f}KB → {total_after/1024:.0f}KB "
          f"({100*total_after/total_before:.0f}%) · 원본은 {SRC.relative_to(ROOT)} 보관")
else:
    print("변환할 PNG가 없습니다.")
