# -*- coding: utf-8 -*-
"""ComfyUI 큐에 장면을 직접 넣고(submit), 렌더된 결과를 프로젝트로 가져온다(harvest).

  python tools/queue_and_harvest.py submit tools/scenes.rest-pair.json
  python tools/queue_and_harvest.py status
  python tools/queue_and_harvest.py harvest

submit 은 폴링하지 않으므로 큐가 길어도 타임아웃으로 죽지 않는다.
harvest 는 C:\\ComfyUI\\output\\skill 에서 이름별 최신 PNG 를
web/assets/img/photo/<name>.png 로 복사한다.
"""
import json
import random
import shutil
import sys
import urllib.request
from pathlib import Path

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")

COMFY = "http://127.0.0.1:8188"
COMFY_OUT = Path(r"C:\ComfyUI\output\skill")
DEST = Path(__file__).resolve().parent.parent / "web" / "assets" / "img" / "photo"


def http_json(url, payload=None):
    data = json.dumps(payload).encode() if payload is not None else None
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def workflow(prompt, width, height, steps, prefix):
    return {
        "1": {"class_type": "UnetLoaderGGUF", "inputs": {"unet_name": "flux1-schnell-Q4_K_S.gguf"}},
        "2": {"class_type": "DualCLIPLoader",
              "inputs": {"clip_name1": "t5xxl_fp8_e4m3fn_scaled.safetensors",
                         "clip_name2": "clip_l.safetensors", "type": "flux", "device": "default"}},
        "3": {"class_type": "CLIPTextEncode", "inputs": {"text": prompt, "clip": ["2", 0]}},
        "4": {"class_type": "ConditioningZeroOut", "inputs": {"conditioning": ["3", 0]}},
        "5": {"class_type": "EmptySD3LatentImage", "inputs": {"width": width, "height": height, "batch_size": 1}},
        "6": {"class_type": "KSampler",
              "inputs": {"model": ["1", 0], "positive": ["3", 0], "negative": ["4", 0],
                         "latent_image": ["5", 0], "seed": random.randint(0, 2 ** 48),
                         "steps": steps, "cfg": 1.0, "sampler_name": "euler",
                         "scheduler": "simple", "denoise": 1.0}},
        "7": {"class_type": "VAELoader", "inputs": {"vae_name": "flux_ae.safetensors"}},
        "8": {"class_type": "VAEDecode", "inputs": {"samples": ["6", 0], "vae": ["7", 0]}},
        "9": {"class_type": "SaveImage", "inputs": {"images": ["8", 0], "filename_prefix": prefix}},
    }


def submit(spec_path):
    spec = json.loads(Path(spec_path).read_text(encoding="utf-8-sig"))
    w, h, steps = spec.get("width", 1280), spec.get("height", 720), spec.get("steps", 4)
    for s in spec["scenes"]:
        wf = workflow(s["prompt"], w, h, steps, f"skill/{s['name']}")
        pid = http_json(f"{COMFY}/prompt", {"prompt": wf})["prompt_id"]
        print(f"  큐 등록 {s['name']} ({w}x{h}) · {pid[:8]}")


def status():
    q = http_json(f"{COMFY}/queue")
    name = lambda items: [i[2].get("9", {}).get("inputs", {}).get("filename_prefix", "?") for i in items]
    run, pend = name(q.get("queue_running", [])), name(q.get("queue_pending", []))
    print(f"진행 중: {run}")
    print(f"대기 {len(pend)}건: {pend}")
    return len(run) + len(pend)


def harvest():
    DEST.mkdir(parents=True, exist_ok=True)
    latest = {}
    for p in COMFY_OUT.glob("*_*.png"):
        base = p.stem.rsplit("_", 2)[0]          # <name>_00001_ → <name>
        if base not in latest or p.stat().st_mtime > latest[base].stat().st_mtime:
            latest[base] = p
    n = 0
    for name, src in sorted(latest.items()):
        dst = DEST / f"{name}.png"
        if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
            continue
        shutil.copy2(src, dst)
        print(f"  가져옴 {name}.png  ({src.stat().st_size / 1024:.0f}KB)")
        n += 1
    print(f"총 {n}장 갱신 · {DEST}")


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd == "submit":
        submit(sys.argv[2])
    elif cmd == "harvest":
        harvest()
    else:
        status()
