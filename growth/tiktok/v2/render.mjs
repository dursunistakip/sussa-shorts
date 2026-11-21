// TikTok v2 (2026-11-21): four visually different formats built from the app's own material instead of generated photos:
//   pick   - pick-a-pile / pick-a-card with the real Sussa card art revealed (photo backgrounds from the app)
//   sky    - a real sky event (positions from astronomy-engine) and what it means for each sign, drawn in code
//   series - "part n/78": one card explained, editorial ivory look, app texts
// usage: node growth/tiktok/v2/render.mjs <spec.json> <outDir>   ->  01.png .. NN.png (1080x1920) + caption.txt
import fs from "fs"; import path from "path"; import { createRequire } from "module"; import { fileURLToPath } from "url";
const require = createRequire("D:/tools/pwnode/package.json"); const { chromium } = require("playwright-core");
const HERE = path.dirname(fileURLToPath(import.meta.url));
const APP = "D:/AppStudio/Apps/Sussa3/web";
const url = (p) => "file:///" + path.resolve(p).replace(/\\/g, "/");
const [specFile, outDir] = process.argv.slice(2);
const spec = JSON.parse(fs.readFileSync(specFile, "utf8")); fs.mkdirSync(outDir, { recursive: true });
const TAROT = JSON.parse(fs.readFileSync(`${APP}/data/tarot.json`, "utf8"));
const cardImg = (n) => url(`${APP}/img/tarot/${String(n).padStart(2, "0")}.webp`);
const cardName = (n) => TAROT[n].t.en.name;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const GLYPH = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"].map((g) => g + "\uFE0E");
const SIGNS = ["Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces"];

const FONTS = `
@font-face{font-family:TT;src:url(${url(path.join(HERE, "../fonts/TikTokSans.ttf"))})}
@font-face{font-family:Fraunces;src:url(${url(APP + "/fonts/fraunces-latin.woff2")});font-weight:100 900}
@font-face{font-family:Jakarta;src:url(${url(APP + "/fonts/jakarta-latin.woff2")});font-weight:200 900}`;
const BASE = `${FONTS}
*{box-sizing:border-box;margin:0;padding:0}
html,body{width:1080px;height:1920px;overflow:hidden}
.s{position:relative;width:1080px;height:1920px;overflow:hidden}
.mark{position:absolute;left:0;right:0;bottom:430px;text-align:center;font:700 26px/1 Jakarta;letter-spacing:.24em;text-transform:uppercase;opacity:.75}`;

// ------------------------------------------------------------------ pick a pile / pick a card
const BACK = (w, num) => `<div class="back" style="width:${w}px;height:${Math.round(w * 1.66)}px">
  <div class="in"><img src="${url(APP + "/img/icon-512.png")}"><i></i></div>${num ? `<b>${num}</b>` : ""}</div>`;
function pickSlides(p) {
  const A = p.accent || "#E9C98B";
  const css = `${BASE}
  .s{background:#0E0B16;color:#fff;font-family:TT}
  .ph{position:absolute;inset:-30px;background:url(${url(APP + "/img/" + p.photo + ".webp")}) center/cover;filter:blur(${p.blur ?? 3}px) brightness(.55) saturate(1.1)}
  .ph::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(10,8,18,.55),rgba(10,8,18,.15) 40%,rgba(10,8,18,.75))}
  .hook{position:absolute;left:80px;right:110px;top:250px;font:800 84px/1.08 TT;letter-spacing:-.01em;text-shadow:0 4px 30px rgba(0,0,0,.6)}
  .hook em{font-style:normal;color:${A}}
  .sub{position:absolute;left:80px;right:110px;top:${p.subTop || 560}px;font:500 40px/1.3 TT;color:rgba(255,255,255,.85)}
  .row{position:absolute;left:0;right:0;top:${p.sub ? 800 : 760}px;display:flex;justify-content:center;gap:26px}
  .back{position:relative;border-radius:26px;background:#1B1830;box-shadow:0 30px 60px rgba(0,0,0,.6),0 0 0 3px ${A};padding:18px}
  .back .in{position:absolute;inset:18px;border:2px solid ${A}88;border-radius:16px;display:grid;place-items:center;
    background:radial-gradient(circle at 50% 50%,#2A2548 0,#1B1830 65%),repeating-radial-gradient(circle,#ffffff08 0 2px,transparent 2px 22px)}
  .back img{width:46%;border-radius:50%;box-shadow:0 0 40px ${A}55}
  .back b{position:absolute;left:50%;bottom:-92px;transform:translateX(-50%);width:76px;height:76px;border-radius:50%;background:${A};color:#1B1830;font:800 44px/76px TT;text-align:center}
  .lab{position:absolute;left:80px;top:250px;font:800 30px/1 TT;letter-spacing:.2em;color:${A};text-transform:uppercase}
  .ttl{position:absolute;left:80px;right:110px;top:300px;font:800 70px/1.08 TT}
  .fan{position:absolute;left:0;right:0;top:${p.fanTop || 520}px;height:620px}
  .fan .c{position:absolute;top:0;width:${p.single ? 430 : 300}px;border-radius:20px;overflow:hidden;box-shadow:0 30px 60px rgba(0,0,0,.6),0 0 0 3px ${A}}
  .fan .c img{display:block;width:100%}
  .names{position:absolute;left:80px;right:110px;top:${p.single ? 1270 : 1090}px;text-align:center;font:700 34px/1.3 TT;color:${A}}
  .msg{position:absolute;left:70px;right:110px;top:${p.single ? 1340 : 1160}px;padding:34px 40px;border-radius:30px;background:rgba(14,11,22,.62);backdrop-filter:blur(14px);
    border:1px solid rgba(255,255,255,.14);font:500 44px/1.32 TT}
  .big{position:absolute;left:80px;right:110px;top:600px;text-align:center;font:800 96px/1.05 TT}
  .cta{position:absolute;left:80px;right:110px;top:900px;text-align:center;font:600 46px/1.35 TT;color:rgba(255,255,255,.9)}
  .cta em{font-style:normal;color:${A}}
  .mark{color:${A}}`;
  const n = p.piles.length, w = p.single ? 300 : 300;
  const out = [];
  out.push(`<div class="s"><div class="ph"></div><div class="hook">${p.hook}</div>${p.sub ? `<div class="sub">${p.sub}</div>` : ""}
    <div class="row">${p.piles.map((_, i) => `<div style="transform:rotate(${(i - (n - 1) / 2) * 5}deg) translateY(${Math.abs(i - (n - 1) / 2) * 24}px)">${BACK(w, i + 1)}</div>`).join("")}</div></div>`);
  p.piles.forEach((pile, i) => {
    const cs = pile.cards, k = cs.length;
    const fan = cs.map((c, j) => { const cw = p.single ? 430 : 300, x = 540 - cw / 2 + (j - (k - 1) / 2) * (p.single ? 0 : 250), r = (j - (k - 1) / 2) * 8;
      return `<div class="c" style="left:${x}px;transform:rotate(${r}deg) translateY(${Math.abs(j - (k - 1) / 2) * 30}px);z-index:${j === Math.floor(k / 2) ? 3 : 1}"><img src="${cardImg(c)}"></div>`; }).join("");
    out.push(`<div class="s"><div class="ph"></div><div class="lab">${p.single ? "card" : "pile"} ${i + 1}</div><div class="ttl">${pile.title}</div>
      <div class="fan">${fan}</div><div class="names">${cs.map(cardName).join(" · ")}</div><div class="msg">${pile.text}</div></div>`);
  });
  out.push(`<div class="s"><div class="ph" style="filter:blur(8px) brightness(.45)"></div><div class="big">${p.outro}</div><div class="cta">${p.cta}</div><div class="mark">sussa · tarot &amp; horoscope</div></div>`);
  return { css, slides: out };
}

// ------------------------------------------------------------------ real sky event
function skySlides(p) {
  const A = "#E9C98B";
  // seeded star field, drawn once per slide as a background image
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const stars = Array.from({ length: 260 }, () => `<circle cx="${(rnd() * 1080).toFixed(0)}" cy="${(rnd() * 1920).toFixed(0)}" r="${(rnd() * 1.8 + .3).toFixed(1)}" fill="#fff" opacity="${(rnd() * .7 + .2).toFixed(2)}"/>`).join("");
  const field = `<svg class="sf" viewBox="0 0 1080 1920">${stars}</svg>`;
  const css = `${BASE}
  .s{background:radial-gradient(ellipse at 50% 30%,#1C2350 0,#0B0E24 55%,#05060F 100%);color:#F3EEE6;font-family:TT}
  .sf{position:absolute;inset:0;width:100%;height:100%}
  .kick{position:absolute;left:80px;right:110px;top:240px;font:700 30px/1.2 Jakarta;letter-spacing:.18em;text-transform:uppercase;color:${A}}
  .hook{position:absolute;left:80px;right:110px;top:300px;font:800 80px/1.08 TT}
  .hook em{font-style:normal;color:${A}}
  .wheel{position:absolute;left:140px;top:${p.wheelTop || 720}px;width:800px;height:800px}
  .wl{position:absolute;left:80px;right:110px;top:1500px;text-align:center;font:500 30px/1.4 Jakarta;color:rgba(243,238,230,.7)}
  .rows{position:absolute;left:60px;right:100px;top:260px;bottom:420px;display:flex;flex-direction:column;justify-content:space-between}
  .r{display:flex;gap:34px;align-items:flex-start;padding:44px 40px;border-radius:34px;background:rgba(255,255,255,.06);border:1px solid rgba(233,201,139,.22)}
  .g{flex:none;width:140px;height:140px;border-radius:50%;display:grid;place-items:center;background:#0B0E24;border:3px solid ${A};font:400 78px/1 "Segoe UI Symbol",serif;color:${A}}
  .r h3{font:800 60px/1.05 TT}
  .r small{display:block;margin-top:10px;font:700 27px/1.25 Jakarta;letter-spacing:.14em;text-transform:uppercase;color:${A}}
  .r p{margin-top:18px;font:500 44px/1.3 TT;color:rgba(243,238,230,.92)}
  .moon{position:absolute;right:120px;top:120px;width:90px;height:90px;border-radius:50%;background:radial-gradient(circle at 40% 38%,#FFF8E6,#E8DCC0 60%,#BFB296);box-shadow:0 0 60px #FFF3D1aa}
  .big{position:absolute;left:80px;right:110px;top:560px;text-align:center;font:800 92px/1.06 TT}
  .cta{position:absolute;left:80px;right:110px;top:900px;text-align:center;font:600 44px/1.36 TT;color:rgba(243,238,230,.9)}
  .cta em{font-style:normal;color:${A}}
  .mark{color:${A}}`;
  // zodiac wheel with the real Sun and Moon longitudes (0 Aries on the left, counter-clockwise like a chart)
  const R = 400, pt = (lon, r) => { const a = (180 + lon) * Math.PI / 180; return [R + r * Math.cos(a), R - r * Math.sin(a)]; };
  let w = `<svg class="wheel" viewBox="0 0 800 800"><circle cx="400" cy="400" r="392" fill="none" stroke="${A}" stroke-opacity=".55" stroke-width="2"/><circle cx="400" cy="400" r="318" fill="none" stroke="${A}" stroke-opacity=".35" stroke-width="2"/>`;
  for (let i = 0; i < 12; i++) {
    const [x1, y1] = pt(i * 30, 392), [x2, y2] = pt(i * 30, 318), [gx, gy] = pt(i * 30 + 15, 355);
    const hot = i === p.moonSign || i === p.sunSign;
    w += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${A}" stroke-opacity=".4"/><text x="${gx}" y="${gy}" text-anchor="middle" dominant-baseline="central" font-family="Segoe UI Symbol" font-size="${hot ? 42 : 34}" fill="${hot ? "#FFF3D1" : A}" opacity="${hot ? 1 : .7}">${GLYPH[i]}</text>`;
  }
  const [mx, my] = pt(p.moonLon, 230), [sx, sy] = pt(p.sunLon, 230);
  w += `<line x1="${mx}" y1="${my}" x2="${sx}" y2="${sy}" stroke="${A}" stroke-dasharray="6 10" stroke-opacity=".6" stroke-width="2"/>
    <defs><radialGradient id="mg" cx="40%" cy="38%"><stop offset="0" stop-color="#FFF8E6"/><stop offset=".6" stop-color="#E8DCC0"/><stop offset="1" stop-color="#BFB296"/></radialGradient>
    <radialGradient id="sg"><stop offset="0" stop-color="#FFE7A3"/><stop offset="1" stop-color="#F0A93C"/></radialGradient></defs>
    <circle cx="${mx}" cy="${my}" r="58" fill="url(#mg)" style="filter:drop-shadow(0 0 30px #FFF3D1)"/><circle cx="${sx}" cy="${sy}" r="40" fill="url(#sg)" style="filter:drop-shadow(0 0 30px #F0A93C)"/>
    <text x="${pt(p.moonLon, 120)[0]}" y="${pt(p.moonLon, 120)[1]}" text-anchor="middle" font-family="Jakarta" font-weight="700" font-size="26" fill="#FFF3D1" letter-spacing="3">MOON ${p.moonDeg}</text>
    <text x="${pt(p.sunLon, 130)[0]}" y="${pt(p.sunLon, 130)[1]}" text-anchor="middle" font-family="Jakarta" font-weight="700" font-size="26" fill="#FFE7A3" letter-spacing="3">SUN ${p.sunDeg}</text></svg>`;
  const out = [`<div class="s">${field}<div class="kick">${p.kicker}</div><div class="hook">${p.hook}</div>${w}<div class="wl">${p.wheelNote}</div></div>`];
  for (let i = 0; i < p.signs.length; i += 3) {
    out.push(`<div class="s">${field}<div class="moon"></div><div class="rows">${p.signs.slice(i, i + 3).map((s) => `<div class="r"><div class="g">${GLYPH[s.sign]}</div><div>
      <h3>${SIGNS[s.sign]}</h3><small>${s.house}</small><p>${s.text}</p></div></div>`).join("")}</div></div>`);
  }
  out.push(`<div class="s">${field}<div class="big">${p.outro}</div><div class="cta">${p.cta}</div><div class="mark">sussa · tarot &amp; horoscope</div></div>`);
  return { css, slides: out };
}

// ------------------------------------------------------------------ 78-card series
function seriesSlides(p) {
  const c = TAROT[p.card].t.en, INK = "#1E1A2E", GOLD = "#B98A3E";
  const css = `${BASE}
  .s{background:#F6F1E8;color:${INK};font-family:Jakarta}
  .s::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 80% 10%,#fff 0,transparent 50%),repeating-linear-gradient(0deg,#00000004 0 2px,transparent 2px 6px)}
  .kick{position:absolute;left:80px;top:230px;font:800 28px/1 Jakarta;letter-spacing:.24em;color:${GOLD};text-transform:uppercase}
  h1{position:absolute;left:80px;right:110px;top:280px;font:600 130px/1 Fraunces;letter-spacing:-.02em}
  .lead{position:absolute;left:80px;right:110px;top:430px;font:500 40px/1.3 Jakarta;color:#5B5568}
  .hero{position:absolute;left:230px;top:560px;width:620px;border-radius:26px;overflow:hidden;transform:rotate(-3deg);box-shadow:0 40px 80px rgba(30,26,46,.28)}
  .hero img,.thumb img{display:block;width:100%}
  .thumb{position:absolute;left:560px;top:960px;width:420px;border-radius:22px;overflow:hidden;transform:rotate(5deg);box-shadow:0 34px 70px rgba(30,26,46,.3)}
  .sec{position:absolute;left:80px;top:250px;font:800 30px/1 Jakarta;letter-spacing:.22em;color:${GOLD};text-transform:uppercase}
  .nm{position:absolute;left:80px;top:296px;font:600 64px/1 Fraunces}
  .txt{position:absolute;left:80px;right:110px;top:${p.txtTop || 420}px;font:500 76px/1.16 Fraunces;letter-spacing:-.01em}
  .note{position:absolute;left:80px;width:440px;top:1000px;font:500 36px/1.4 Jakarta;color:#5B5568}
  .chips{position:absolute;left:80px;width:440px;top:1000px;display:flex;flex-direction:column;align-items:flex-start;gap:18px}
  .chips span{font:700 32px/1 Jakarta;padding:20px 28px;border-radius:99px;background:#1B1830;color:#E9C98B}
  .yn{position:absolute;left:80px;right:110px;top:560px;display:flex;gap:30px}
  .yn div{flex:1;border-radius:30px;padding:40px 30px;text-align:center;background:#fff;box-shadow:0 20px 40px rgba(30,26,46,.1)}
  .yn b{display:block;font:600 110px/1 Fraunces}
  .yn span{display:block;margin-top:16px;font:700 28px/1.2 Jakarta;letter-spacing:.14em;text-transform:uppercase;color:#5B5568}
  .next{position:absolute;left:80px;right:110px;top:1030px;padding:44px;border-radius:30px;background:#1B1830;color:#F3EEE6;font:600 50px/1.25 Fraunces}
  .next small{display:block;margin-bottom:14px;font:800 26px/1 Jakarta;letter-spacing:.22em;color:#E9C98B;text-transform:uppercase}
  .mark{color:${GOLD}}`;
  const sec = (label, text, extra = "") => `<div class="s"><div class="thumb"><img src="${cardImg(p.card)}"></div><div class="sec">${label}</div><div class="nm">${c.name}</div><div class="txt">${esc(text)}</div>${extra}</div>`;
  const out = [
    `<div class="s"><div class="kick">part ${p.part} / 78 · tarot meanings</div><h1>${c.name}</h1><div class="lead">${p.lead}</div><div class="hero"><img src="${cardImg(p.card)}"></div></div>`,
    sec("upright", c.up, `<div class="chips">${c.kw.map((k) => `<span>${esc(k.toLowerCase())}</span>`).join("")}</div>`),
    sec("reversed", c.rev, p.revNote ? `<div class="note">${p.revNote}</div>` : ""),
    sec("in love", c.love),
    sec("at work", c.career, `<div class="note"><b>advice:</b> ${esc(c.advice.toLowerCase())}</div>`),
    `<div class="s"><div class="sec">yes or no?</div><div class="nm">${c.name}</div><div class="yn"><div><b>yes</b><span>upright</span></div><div><b>no</b><span>reversed</span></div></div>
      <div class="next"><small>part ${p.part + 1} / 78</small>${p.next}</div><div class="mark">sussa · tarot &amp; horoscope</div></div>`,
  ];
  return { css, slides: out };
}

const { css, slides } = spec.format === "pick" ? pickSlides(spec) : spec.format === "sky" ? skySlides(spec) : seriesSlides(spec);
const b = await chromium.launch({ executablePath: "C:/Users/isadu/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe" });
const pg = await b.newPage({ viewport: { width: 1080, height: 1920 } });
for (const [i, s] of slides.entries()) {
  const f = path.join(outDir, "_tmp.html"); fs.writeFileSync(f, `<!doctype html><html><head><meta charset="utf-8"><style>${css}</style></head><body>${s}</body></html>`);
  await pg.goto(url(f)); await pg.evaluate(() => document.fonts.ready); await pg.waitForTimeout(150);
  await pg.screenshot({ path: path.join(outDir, `${String(i + 1).padStart(2, "0")}.png`) });
}
fs.rmSync(path.join(outDir, "_tmp.html"), { force: true });
fs.writeFileSync(path.join(outDir, "caption.txt"), spec.caption + "\n");
await b.close(); console.log(path.basename(outDir), slides.length, "slides");
