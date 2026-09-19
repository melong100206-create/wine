# -*- coding: utf-8 -*-
"""히어로 영상 생성 — 실사 스틸을 Wan2.2 I2V 로 움직이는 클립으로 만들고 ffmpeg 으로 잇는다.

  python tools/gen-hero-video.py submit      # 클립 3개를 ComfyUI 큐에 등록 (폴링하지 않음)
  python tools/gen-hero-video.py status      # 큐 상태
  python tools/gen-hero-video.py assemble    # 렌더된 클립을 web/assets/video/hero.mp4 로 조립

로컬 ComfyUI(C:\\ComfyUI)와 Wan2.2-I2V-A14B(Q4, 4-step Lightning LoRA) 워크플로를 사용한다.
워크플로 원본: C:\\qt-video\\workflows\\wan_i2v_api.json
"""
import json
import random
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

COMFY = "http://127.0.0.1:8188"
COMFY_DIR = Path(r"C:\ComfyUI")
WF = Path(r"C:\qt-video\workflows\wan_i2v_api.json")
ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "web" / "assets" / "img" / "photo" / "_src"
OUT_VIDEO = ROOT / "web" / "assets" / "video"
WORK = ROOT / "tools" / "_clips"

W, H = 832, 480          # 가로형 히어로
PREFIX = "wine/hero"

# (스틸, 모션 프롬프트) — 다크 럭셔리 톤을 유지하는 아주 느린 카메라 무빙만 지시한다.
CLIPS = [
    ("hero", "very slow smooth forward dolly along the vineyard row at blue hour, "
             "gentle drifting mist between the vines, lanterns flickering warmly, "
             "leaves swaying slightly in a soft breeze, cinematic, static camera height, subtle motion"),
    ("hero-pour", "dark red wine pouring smoothly into the glass, liquid swirling and settling, "
                  "slow subtle camera push in, cinematic macro, elegant slow motion"),
    ("craft-onggi", "very slow camera drift through the dim cellar past the earthenware jars, "
                    "dust motes floating in the shaft of light, calm and quiet, cinematic, subtle motion"),
]


def http_json(url, payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return json.loads(r.read().decode())


def submit():
    base = json.loads(WF.read_text(encoding="utf-8"))
    for i, (name, motion) in enumerate(CLIPS):
        img = SRC / f"{name}.png"
        if not img.exists():
            print(f"  건너뜀 {name} (원본 없음)")
            continue
        input_name = f"wine_{name}.png"
        shutil.copy(img, COMFY_DIR / "input" / input_name)

        wf = json.loads(json.dumps(base))
        seed = random.randint(0, 2 ** 48)
        wf["8"]["inputs"]["text"] = motion
        wf["11"]["inputs"]["image"] = input_name
        wf["12"]["inputs"]["width"] = W
        wf["12"]["inputs"]["height"] = H
        wf["13"]["inputs"]["noise_seed"] = seed
        wf["14"]["inputs"]["noise_seed"] = seed
        wf["17"]["inputs"]["filename_prefix"] = f"{PREFIX}_{i:02d}_{name}"
        pid = http_json(f"{COMFY}/prompt", {"prompt": wf})["prompt_id"]
        print(f"  큐 등록 {name} ({W}x{H}, 81f@16fps) · {pid[:8]}")


def status():
    q = http_json(f"{COMFY}/queue")
    nm = lambda items: [i[2].get("17", {}).get("inputs", {}).get("filename_prefix")
                        or i[2].get("9", {}).get("inputs", {}).get("filename_prefix", "?") for i in items]
    print("진행 중:", nm(q.get("queue_running", [])))
    print(f"대기 {len(q.get('queue_pending', []))}건:", nm(q.get("queue_pending", [])))


def collect():
    """ComfyUI output 에서 이름별 최신 클립을 tools/_clips 로 모은다."""
    WORK.mkdir(parents=True, exist_ok=True)
    got = []
    for i, (name, _) in enumerate(CLIPS):
        cands = sorted((COMFY_DIR / "output" / "wine").glob(f"hero_{i:02d}_{name}*.mp4"),
                       key=lambda p: p.stat().st_mtime)
        if not cands:
            print(f"  ! {name} 클립 없음")
            continue
        dst = WORK / f"{i:02d}_{name}.mp4"
        shutil.copy2(cands[-1], dst)
        got.append(dst)
        print(f"  수집 {dst.name} ({dst.stat().st_size / 1024:.0f}KB)")
    return got


def assemble():
    clips = collect()
    if not clips:
        sys.exit("조립할 클립이 없습니다. 먼저 submit 후 렌더가 끝나길 기다리세요.")
    OUT_VIDEO.mkdir(parents=True, exist_ok=True)
    out = OUT_VIDEO / "hero.mp4"

    # 각 클립 4.4초 사용 + 0.8초 크로스페이드로 이어 붙이고, 마지막은 첫 장면으로 되돌려 루프가 튀지 않게 한다.
    seg, fade, fps = 4.4, 0.8, 24
    inputs, filters, labels = [], [], []
    order = clips + [clips[0]]
    for idx, c in enumerate(order):
        inputs += ["-i", str(c)]
        filters.append(
            f"[{idx}:v]trim=0:{seg},setpts=PTS-STARTPTS,fps={fps},scale=1280:720:flags=lanczos,"
            f"eq=contrast=1.06:saturation=0.94:gamma=0.97,format=yuv420p[v{idx}]")
        labels.append(f"[v{idx}]")

    chain, prev, off = [], labels[0], 0.0
    for i in range(1, len(labels)):
        off += seg - fade
        tag = f"[x{i}]"
        chain.append(f"{prev}{labels[i]}xfade=transition=fade:duration={fade}:offset={off:.2f}{tag}")
        prev = tag
    # 마지막 페이드 인/아웃으로 루프 이음새를 감춘다
    chain.append(f"{prev}fade=t=in:st=0:d=0.6,fade=t=out:st={off + seg - 0.6:.2f}:d=0.6[out]")

    cmd = ["ffmpeg", "-y", *inputs,
           "-filter_complex", ";".join(filters + chain),
           "-map", "[out]", "-an",
           "-c:v", "libx264", "-profile:v", "high", "-preset", "slow", "-crf", "27",
           "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(out)]
    print("  ffmpeg 조립 중...")
    r = subprocess.run(cmd, capture_output=True, text=True, encoding="utf-8", errors="replace")
    if r.returncode != 0:
        print(r.stderr[-2500:])
        sys.exit("ffmpeg 실패")
    print(f"  완성 → {out} ({out.stat().st_size / 1024 / 1024:.1f}MB)")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    {"submit": submit, "status": status, "assemble": assemble, "collect": collect}[cmd]()
