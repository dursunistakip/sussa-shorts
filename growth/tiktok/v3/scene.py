# Photographic table plates for TikTok v3 (2026-11-21).
# Real material only: CC0 Poly Haven surface scans + public-domain 1909 Rider-Waite-Smith card scans (Wikimedia Commons).
# Lighting, shadows and sensor grain are added so the plate reads like a phone photo taken from above.
# usage: python scene.py plates.json   (list of {out, tex, seed, light, items, blur, dim, w, h})
import json, sys, os, math
import numpy as np
from PIL import Image, ImageFilter, ImageOps

HERE = os.path.dirname(os.path.abspath(__file__))
REAL = os.path.join(HERE, "..", "assets", "real")
CUT = os.path.join(REAL, "cut")
os.makedirs(CUT, exist_ok=True)
OW, OH = 1080, 1920
M = 240
W, H = OW + 2 * M, OH + 2 * M

# how much of each 4k scan the frame shows (pixels of source width) and a colour/exposure trim
TEX = {
    "velvet":   ("velour_velvet.jpg", 1500, (0.80, 0.70, 0.78), 1.00),
    "jacquard": ("floral_jacquard.jpg", 2000, (0.85, 0.85, 0.90), 1.00),
    "linen":    ("rough_linen.jpg", 1300, (0.92, 0.92, 0.96), 1.05),
    "satin":    ("crepe_satin.jpg", 1700, (1.0, 0.95, 0.88), 0.95),
    "wood":     ("dark_wood.jpg", 2300, (1.0, 0.95, 0.90), 1.10),
    "cherry":   ("lacquered_cherry_wood.jpg", 2300, (1.0, 0.96, 0.92), 1.00),
    "rosewood": ("rosewood_veneer1.jpg", 2300, (1.0, 0.96, 0.92), 1.00),
    "floor":    ("old_wooden_floor_01.jpg", 2300, (1.0, 0.95, 0.90), 1.00),
    "fleece":   ("knitted_fleece.jpg", 1500, (1.0, 0.97, 0.93), 1.00),
    "boucle":   ("wool_boucle.jpg", 1800, (1.0, 0.98, 0.95), 1.00),
    "quatrefoil": ("quatrefoil_jacquard_fabric.jpg", 1800, (0.75, 0.70, 0.75), 1.00),
}
_tex_cache = {}


def surface(name, seed):
    f, cw, tint, ex = TEX[name]
    if f not in _tex_cache:
        _tex_cache[f] = Image.open(os.path.join(REAL, "tex", f)).convert("RGB")
    src = _tex_cache[f]
    rng = np.random.default_rng(seed)
    cw = int(cw * W / OW)
    cw = min(cw, src.width - 1)
    ch = min(int(cw * H / W), src.height - 1)
    cw = int(ch * W / H)
    x = int(rng.integers(0, src.width - cw)); y = int(rng.integers(0, max(1, src.height - ch)))
    im = src.crop((x, y, x + cw, y + ch))
    if rng.random() < 0.5: im = ImageOps.mirror(im)
    im = im.resize((W, H), Image.LANCZOS)
    a = np.asarray(im).astype(np.float32) / 255.0
    return np.clip(a * np.array(tint, np.float32) * ex, 0, 1)


def _cut(path, key):
    out = os.path.join(CUT, key + ".png")
    if os.path.exists(out):
        return Image.open(out)
    im = Image.open(path).convert("RGB")
    a = np.asarray(im).astype(np.int16)
    paper = (a.min(axis=2) < 232)  # scanner bed is near pure white, card stock is cream
    rows = np.where(paper.mean(axis=1) > 0.55)[0]; cols = np.where(paper.mean(axis=0) > 0.55)[0]
    t, b, l, r = rows[0] + 3, rows[-1] - 3, cols[0] + 3, cols[-1] - 3
    card = im.crop((l, t, r, b))
    w, h = card.size
    m = Image.new("L", (w * 4, h * 4), 0)
    from PIL import ImageDraw
    ImageDraw.Draw(m).rounded_rectangle((0, 0, w * 4 - 1, h * 4 - 1), radius=int(w * 4 * 0.05), fill=255)
    card.putalpha(m.resize((w, h), Image.LANCZOS))
    card.save(out)
    return card


def card_img(n):
    return _cut(os.path.join(REAL, "rws", f"{n:02d}.jpg"), f"{n:02d}")


def back_img(like):
    # the published 1909 back (roses & lilies scan), sized to the face proportions
    b = _cut(os.path.join(REAL, "rws", "back.jpg"), "back")
    return b.resize(like.size, Image.LANCZOS)


def place(canvas, img, cx, cy, w, rot, lift=1.0):
    """composite an RGBA card (already sized to width w) with a soft lamp shadow and a contact shadow"""
    s = w / img.width
    im = img.resize((int(w), int(img.height * s)), Image.LANCZOS).rotate(rot, Image.BICUBIC, expand=True)
    pad = int(w * 0.25)
    im = ImageOps.expand(im, border=pad, fill=(0, 0, 0, 0))
    A = np.asarray(im.getchannel("A")).astype(np.float32) / 255.0
    rgb = np.asarray(im.convert("RGB")).astype(np.float32) / 255.0
    hh, ww = A.shape
    x0, y0 = int(cx - ww / 2), int(cy - hh / 2)

    def mul_shadow(blur, dx, dy, op):
        sh = Image.fromarray((A * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(blur))
        sh = np.asarray(sh).astype(np.float32) / 255.0
        _blend(canvas, 1 - op * sh, x0 + int(dx), y0 + int(dy), mode="mul")

    mul_shadow(w * 0.07 * lift, w * 0.035 * lift, w * 0.06 * lift, 0.50)
    mul_shadow(3, 1.5, 2.5, 0.55)
    _blend(canvas, (rgb, A), x0, y0, mode="over")
    return (x0, y0, ww, hh)


def _blend(canvas, src, x0, y0, mode):
    if mode == "mul":
        m = src; hh, ww = m.shape
    else:
        rgb, A = src; hh, ww = A.shape
    cx0, cy0 = max(0, x0), max(0, y0); cx1, cy1 = min(W, x0 + ww), min(H, y0 + hh)
    if cx1 <= cx0 or cy1 <= cy0: return
    sx0, sy0 = cx0 - x0, cy0 - y0; sx1, sy1 = sx0 + (cx1 - cx0), sy0 + (cy1 - cy0)
    reg = canvas[cy0:cy1, cx0:cx1]
    if mode == "mul":
        reg *= m[sy0:sy1, sx0:sx1, None]
    else:
        a = A[sy0:sy1, sx0:sx1, None]
        reg[:] = reg * (1 - a) + rgb[sy0:sy1, sx0:sx1] * a


def pile(canvas, cx, cy, w, rot, n=9, seed=0):
    rng = np.random.default_rng(seed)
    face = card_img(0)
    back = back_img(face)
    edge = Image.new("RGBA", back.size, (178, 165, 140, 255)); edge.putalpha(back.getchannel("A"))
    for k in range(n):
        j = rng.normal(0, 0.9, 3)
        img = back if k == n - 1 else edge
        place(canvas, img, cx + k * 0.9 + j[0], cy - k * 2.4 + j[1], w, rot + j[2] * 0.6, lift=0.5 if k else 1.0)


def light(canvas, lx, ly, warm=1.0, spread=1.0, floor=0.42):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d2 = ((xx - lx) ** 2 + (yy - ly) ** 2) / (2 * (950 * spread) ** 2)
    L = floor + (1.25 - floor) * np.exp(-d2)
    # broad vignette from the lens
    v = 1 - 0.35 * (((xx - W / 2) / (OW * 0.75)) ** 2 + ((yy - H / 2) / (OH * 0.75)) ** 2)
    L = L * np.clip(v, 0.55, 1)
    tint = np.array([1.0, 0.93 - 0.03 * warm, 0.80 - 0.08 * warm], np.float32)
    canvas *= L[..., None] * tint
    return canvas


def tilt(im, k=0.17, top=70):
    """phone held at an angle: the far (top) edge of the table covers more of the frame"""
    a = int(OW * k / 2)
    quad = (M - a, M - top, M - 10, M + OH, M + OW + 10, M + OH, M + OW + a, M - top)  # TL, BL, BR, TR
    out = im.transform((OW, OH), Image.QUAD, quad, Image.BICUBIC)
    # shallow depth of field: far edge and near edge slightly soft
    soft = out.filter(ImageFilter.GaussianBlur(5)); near = out.filter(ImageFilter.GaussianBlur(2.2))
    yy = np.linspace(0, 1, OH, dtype=np.float32)[:, None, None]
    mf = np.clip((0.30 - yy) / 0.30, 0, 1) ** 1.4; mn = np.clip((yy - 0.84) / 0.16, 0, 1)
    o = np.asarray(out).astype(np.float32); o = o * (1 - mf - mn) + np.asarray(soft) * mf + np.asarray(near) * mn
    return Image.fromarray(np.clip(o, 0, 255).astype(np.uint8))


def finish(canvas, seed, blur=0.0, dim=0.0, grain=0.022, do_tilt=True):
    rng = np.random.default_rng(seed + 99)
    c = np.clip(canvas, 0, None)
    c = c / (1 + 0.18 * c)  # soft highlight roll-off like a phone tone curve
    c = np.clip(c * 1.12, 0, 1)
    c = c ** 0.95
    if dim: c *= (1 - dim)
    im = Image.fromarray((c * 255).astype(np.uint8))
    if do_tilt: im = tilt(im)
    else: im = im.crop((M, M, M + OW, M + OH))
    c = np.asarray(im).astype(np.float32) / 255.0
    lum = rng.normal(0, grain, (OH // 2, OW // 2)).astype(np.float32)
    lum = np.asarray(Image.fromarray(lum).resize((OW, OH), Image.BILINEAR))
    c = np.clip(c + lum[..., None] * (0.6 + 0.4 * (1 - c)), 0, 1)
    im = Image.fromarray((c * 255).astype(np.uint8))
    if blur: im = im.filter(ImageFilter.GaussianBlur(blur))
    else: im = im.filter(ImageFilter.UnsharpMask(radius=1.2, percent=40, threshold=2))
    return im


def photo_plate(p):
    """a real photo (NASA public domain moon shots etc.) cropped to 9:16 with phone-like grain"""
    im = Image.open(os.path.join(REAL, p["photo"])).convert("RGB")
    if p.get("contain"):  # whole photo on black (space shots), placed at cy
        cw = p.get("cw", OW); im = im.resize((cw, int(im.height * cw / im.width)), Image.LANCZOS)
        bg = Image.new("RGB", (OW, OH), (0, 0, 0)); bg.paste(im, ((OW - cw) // 2, int(p.get("cy", 500) - im.height / 2))); im = bg
    z = p.get("zoom", 1.0)
    sc = max(OW / im.width, OH / im.height) * z
    im = im.resize((int(im.width * sc + .5), int(im.height * sc + .5)), Image.LANCZOS)
    fx, fy = p.get("fx", 0.5), p.get("fy", 0.5)
    x = int(min(max(fx * im.width - OW / 2, 0), im.width - OW)); y = int(min(max(fy * im.height - OH / 2, 0), im.height - OH))
    im = im.crop((x, y, x + OW, y + OH))
    if p.get("mirror"): im = ImageOps.mirror(im)
    c = np.asarray(im).astype(np.float32) / 255.0
    if p.get("dim"): c *= 1 - p["dim"]
    rng = np.random.default_rng(p.get("seed", 1))
    lum = np.asarray(Image.fromarray(rng.normal(0, 0.018, (OH // 2, OW // 2)).astype(np.float32)).resize((OW, OH), Image.BILINEAR))
    c = np.clip(c + lum[..., None], 0, 1)
    out = Image.fromarray((c * 255).astype(np.uint8))
    if p.get("blur"): out = out.filter(ImageFilter.GaussianBlur(p["blur"]))
    out.save(p["out"])


def build(p):
    if "photo" in p:
        return photo_plate(p)
    seed = p.get("seed", 1)
    canvas = surface(p["tex"], seed)
    boxes = []
    for it in p.get("items", []):
        t = it["type"]
        if t == "pile":
            pile(canvas, it["x"] + M, it["y"] + M, it["w"], it.get("rot", 0), it.get("n", 9), seed + len(boxes))
            boxes.append([it["x"], it["y"]])
        else:
            img = card_img(it["n"]) if t == "card" else back_img(card_img(0))
            if it.get("rev"): img = img.rotate(180)
            boxes.append(place(canvas, img, it["x"] + M, it["y"] + M, it["w"], it.get("rot", 0)))
    lx, ly = p.get("light", [180, 260])
    light(canvas, lx + M, ly + M, p.get("warm", 1.0), p.get("spread", 0.85), p.get("floor", 0.32))
    im = finish(canvas, seed, p.get("blur", 0), p.get("dim", 0), do_tilt=p.get("tilt", True))
    im.save(p["out"], quality=92) if p["out"].endswith(".jpg") else im.save(p["out"])
    return boxes


if __name__ == "__main__":
    plates = json.load(open(sys.argv[1], encoding="utf-8"))
    for p in plates:
        build(p)
        print("plate", os.path.basename(p["out"]), flush=True)
