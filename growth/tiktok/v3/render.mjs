// TikTok v3 (2026-11-21): same scripts as v2, but every picture is real material instead of drawn or generated art:
//   - cards: public-domain 1909 Rider-Waite-Smith scans (Wikimedia Commons), laid on CC0 Poly Haven table/cloth scans
//     with lamp light, soft shadows, a slight camera tilt and sensor grain (scene.py), so a slide reads like a phone photo
//   - sky: NASA public-domain moonrise photos
//   - text: TikTok's own look (TikTok Sans, white boxes / plain white with shadow), no badges, gradients or accent colours
// usage: node growth/tiktok/v3/render.mjs <spec.json> <outDir>   ->  01.png .. NN.png (1080x1920) + caption.txt
import fs from "fs"; import path from "path"; import { execFileSync } from "child_process";
import { createRequire } from "module"; import { fileURLToPath } from "url";
const require = createRequire("D:/tools/pwnode/package.json"); const { chromium } = require("playwright-core");
const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = "D:/AppStudio/Apps/Sussa3/web";
const url = (p) => "file:///" + path.resolve(p).replace(/\\/g, "/");
const [specFile, outDir] = process.argv.slice(2);
const spec = JSON.parse(fs.readFileSync(specFile, "utf8")); fs.mkdirSync(outDir, { recursive: true });
const TAROT = JSON.parse(fs.readFileSync(`${APP}/data/tarot.json`, "utf8"));
const cardName = (n) => TAROT[n].t.en.name;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const plain = (s) => String(s).replace(/<\/?em>/g, "");             // hooks keep <br>, lose colour accents
const lines = (s) => plain(s).split(/<br\s*\/?>/).filter((l) => l.trim()).map((l) => `<span>${l}</span>`).join("<br>");
const SIGNS = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"];
let seed = spec.seed || 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const jit = (a) => +((rnd() * 2 - 1) * a).toFixed(2);

const CSS = `
@font-face{font-family:TT;src:url(${url(path.join(HERE, "../fonts/TikTokSans.ttf"))});font-weight:300 900;font-stretch:75% 150%}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1920px;overflow:hidden}
.s{position:relative;width:1080px;height:1920px;overflow:hidden;background:#000 center/cover no-repeat;font-family:TT}
.bx{position:absolute;left:70px;right:70px;text-align:center}
.bx span{background:#fff;color:#121212;font:650 54px/1.46 TT;padding:5px 20px;border-radius:12px;-webkit-box-decoration-break:clone;box-decoration-break:clone}
.bx.sm span{font-size:44px}
.bx.dk span{background:rgba(0,0,0,.66);color:#fff}
.pl{position:absolute;left:70px;right:70px;text-align:center;color:#fff;font:800 50px/1.25 TT;
  text-shadow:0 0 3px rgba(0,0,0,.85),0 2px 12px rgba(0,0,0,.55)}
.pl.big{font-size:88px;line-height:1.08}
.pl.sm{font:700 34px/1.3 TT}
.num{position:absolute;width:120px;margin-left:-60px;text-align:center;color:#fff;font:800 92px/1 TT;text-shadow:0 0 4px rgba(0,0,0,.9),0 3px 14px rgba(0,0,0,.6)}`;

const plates = [];
const plate = (p) => { const f = path.join(outDir, `_plate${plates.length}.png`); plates.push({ ...p, out: f }); return url(f); };
const slide = (bg, inner) => `<div class="s" style="background-image:url(${bg})">${inner}</div>`;
const box = (top, html, cls = "") => `<div class="bx ${cls}" style="top:${top}px">${html}</div>`;
const txt = (top, html, cls = "") => `<div class="pl ${cls}" style="top:${top}px">${html}</div>`;
const para = (s) => `<span>${esc(s)}</span>`;

// ------------------------------------------------------------------ pick a pile / pick a card
function pickSlides(p) {
  const tex = p.tex || (p.single ? "wood" : "jacquard"), L = p.light || [170, 260], n = p.piles.length;
  const base = { tex, light: L, seed: p.seed || 7 };
  const xs = n === 3 ? [215, 540, 865] : [300, 780];
  const down = xs.map((x, i) => p.single
    ? { type: "back", x, y: 1010 + jit(14), w: 280, rot: jit(4) }
    : { type: "pile", x, y: 1010 + jit(14), w: 250, rot: jit(5), n: 9 });
  const out = [];
  out.push(slide(plate({ ...base, items: down }), box(200, lines(p.hook)) + (p.sub ? box(560, `<span>${esc(p.sub)}</span>`, "sm dk") : "")
    + xs.map((x, i) => `<div class="num" style="left:${x}px;top:${p.single ? 1300 : 1270}px">${i + 1}</div>`).join("")));
  p.piles.forEach((pile, i) => {
    const cs = pile.cards, k = cs.length;
    const items = cs.map((c, j) => k === 1
      ? { type: "card", n: c, x: 540, y: 880, w: 470, rot: jit(3) }
      : { type: "card", n: c, x: 540 + (j - (k - 1) / 2) * 250, y: 860 + Math.abs(j - (k - 1) / 2) * 30, w: 300, rot: (j - (k - 1) / 2) * 8 + jit(2) });
    // centre card on top
    if (k === 3) items.push(items.splice(1, 1)[0]);
    out.push(slide(plate({ ...base, seed: base.seed + i + 1, items }),
      box(170, `<span>${p.single ? "card" : "pile"} ${i + 1}: ${esc(pile.title)}</span>`)
      + txt(k === 1 ? 1320 : 1240, esc(cs.map(cardName).join(" · ")), "sm")
      + `<div class="bx sm" style="top:${k === 1 ? 1390 : 1310}px;right:120px">${para(pile.text)}</div>`));
  });
  out.push(slide(plate({ ...base, items: down, blur: 7, dim: 0.35 }), txt(620, plain(p.outro), "big") + box(900, lines(p.cta), "sm")
    + txt(1380, "sussa · tarot &amp; horoscope", "sm")));
  return out;
}

// ------------------------------------------------------------------ real sky event (NASA moonrise photos)
function skySlides(p) {
  const ph = p.photos || [
    { photo: "moon/NHQ202110190011.jpg", fx: .5, fy: .5 },
    { photo: "moon/MAF_20210525_NOLAMoonrise1.jpg", fx: .42, fy: .5, dim: .45 },
    { photo: "moon/NHQ202110190008.jpg", fx: .5, fy: .5, dim: .4 },
    { photo: "moon/MAF_20210822_MoonOverNOLA.jpg", fx: .62, fy: .5, dim: .45 },
    { photo: "moon/NHQ202501130002.jpg", fx: .5, fy: .5, dim: .45 },
    { photo: "moon/NHQ202110190011.jpg", fx: .5, fy: .6, dim: .5, blur: 3 },
  ];
  const out = [];
  const ht = p.hookTop || 630;
  out.push(slide(plate({ ...ph[0], seed: 3 }), txt(ht - 70, esc(p.kicker), "sm") + box(ht, lines(p.hook)) + txt(ht + 550, esc(p.wheelNote), "sm")));
  for (let i = 0; i < p.signs.length; i += 3) {
    const g = p.signs.slice(i, i + 3);
    out.push(slide(plate({ ...ph[1 + (i / 3) % 4], seed: 4 + i }), g.map((s, j) => {
      const top = 190 + j * 430;
      return txt(top, `${SIGNS[s.sign]} <span style="font-weight:600;font-size:34px;opacity:.9">· ${esc(s.house)}</span>`)
        + `<div class="bx sm" style="top:${top + 78}px;right:110px">${para(s.text)}</div>`;
    }).join("")));
  }
  out.push(slide(plate({ ...ph[5], seed: 9 }), txt(560, plain(p.outro), "big") + box(860, lines(p.cta), "sm") + txt(1380, "sussa · tarot &amp; horoscope", "sm")));
  return out;
}

// ------------------------------------------------------------------ 78-card series
function seriesSlides(p) {
  const c = TAROT[p.card].t.en, tex = p.tex || "rosewood", L = p.light || [880, 220];
  const base = { tex, light: L, seed: p.seed || 21 };
  const deck = { type: "pile", x: 960, y: 1560, w: 330, rot: 14, n: 12 };
  const hero = plate({ ...base, items: [deck, { type: "card", n: p.card, x: 500, y: 1020, w: 540, rot: -4 }] });
  const side = plate({ ...base, items: [deck, { type: "card", n: p.card, x: 760, y: 1420, w: 400, rot: 7 }] });
  const sec = (label, text, extra = "") => slide(side, txt(170, `${esc(c.name.toLowerCase())} · ${label}`, "sm") + box(240, para(text.toLowerCase())) + extra);
  return [
    slide(hero, txt(150, `part ${p.part} of 78 · tarot meanings`, "sm") + box(215, `<span>${esc(c.name.toLowerCase())}</span>`)
      + box(330, `<span>${esc(p.lead)}</span>`, "sm dk")),
    sec("upright", c.up, `<div class="bx sm dk" style="top:820px;left:70px;right:auto;text-align:left">${c.kw.map((k) => `<span>${esc(k.toLowerCase())}</span>`).join("<br>")}</div>`),
    sec("reversed", c.rev, p.revNote ? `<div class="bx sm dk" style="top:820px;right:430px;text-align:left">${para(p.revNote)}</div>` : ""),
    sec("in love", c.love),
    sec("at work", c.career, `<div class="bx sm dk" style="top:820px;right:430px;text-align:left"><span>advice: ${esc(c.advice.toLowerCase())}</span></div>`),
    slide(side, txt(170, `${esc(c.name.toLowerCase())} · yes or no?`, "sm") + box(240, (p.yn || ["upright: yes", "reversed: not yet"]).map((l) => `<span>${esc(l)}</span>`).join("<br>"))
      + `<div class="bx sm dk" style="top:560px">${`<span>next · part ${p.part + 1}</span><br>` + para(p.next)}</div>` + txt(1000, "sussa · tarot &amp; horoscope", "sm")),
  ];
}

// ------------------------------------------------------------------ zodiac ranking (countdown #12 -> #1) on a real table photo
function rankSlides(p) {
  const base = { tex: p.tex || "wood", light: p.light || [200, 260], seed: p.seed || 31 };
  const spread = [{ type: "pile", x: 250, y: 1150, w: 260, rot: -12, n: 10 }, { type: "card", n: p.cards[0], x: 560, y: 1050, w: 300, rot: -3 },
    { type: "card", n: p.cards[1], x: 860, y: 1120, w: 300, rot: 9 }];
  const sharp = plate({ ...base, items: spread }), soft = plate({ ...base, items: spread, blur: 9, dim: 0.42 });
  const out = [slide(sharp, box(220, lines(p.hook)) + (p.sub ? box(520, `<span>${esc(p.sub)}</span>`, "sm dk") : ""))];
  const n = p.items.length;
  for (let i = 0; i < n; i += 3) out.push(slide(soft, p.items.slice(i, i + 3).map((it, j) => {
    const top = 200 + j * 400;
    return txt(top, `#${n - i - j} ${esc(SIGNS[it.sign])}`) + `<div class="bx sm" style="top:${top + 78}px;right:110px">${para(it.text)}</div>`;
  }).join("")));
  out.push(slide(soft, txt(600, plain(p.outro), "big") + box(880, lines(p.cta), "sm") + txt(1380, "sussa · tarot &amp; horoscope", "sm")));
  return out;
}

const slides = spec.format === "pick" ? pickSlides(spec) : spec.format === "sky" ? skySlides(spec) : spec.format === "rank" ? rankSlides(spec) : seriesSlides(spec);
const pj = path.join(outDir, "_plates.json"); fs.writeFileSync(pj, JSON.stringify(plates));
execFileSync("python", [path.join(HERE, "scene.py"), pj], { stdio: "inherit" });
const b = await chromium.launch({ executablePath: "C:/Users/isadu/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe" });
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
for (const [i, s] of slides.entries()) {
  const f = path.join(outDir, "_tmp.html"); fs.writeFileSync(f, `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body>${s}</body></html>`);
  await pg.goto(url(f)); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(120);
  await pg.screenshot({ path: path.join(outDir, `${String(i + 1).padStart(2, "0")}.png`) });
}
await b.close();
for (const f of fs.readdirSync(outDir)) if (f.startsWith("_")) fs.rmSync(path.join(outDir, f), { force: true });
fs.writeFileSync(path.join(outDir, "caption.txt"), spec.caption + "\n");
console.log(path.basename(outDir), slides.length, "slides");
