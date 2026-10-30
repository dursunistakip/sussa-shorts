// Sussa short videos (1080x1920, 30 fps, music) for YouTube Shorts / Reels / TikTok, made from the app's own daily content:
//   pick  – "Pick a card": three face-down cards, then each one revealed with its meaning (cards of the day, same for everyone)
//   signs – "Daily horoscope": all 12 signs, each with today's opening line and strongest meter
// node growth/render.mjs <lang> <pick|signs> [YYYY-MM-DD]  ->  growth/out/<date>/<lang>_<kind>.mp4 + .json (title, description, tags)
// Frames are rendered deterministically (window.seek(t) + screenshot), so the result never depends on machine speed.
import { createRequire } from "module";
import { spawn } from "child_process";
import fs from "fs"; import path from "path"; import { fileURLToPath, pathToFileURL } from "url";
import { loadSky } from "./sky-loader.mjs";
import { concepts, RUNTIME } from "./concepts.mjs";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const G = path.join(ROOT, "growth"), A = path.join(G, "assets");
const require = createRequire(process.env.PW_REQUIRE || path.join(ROOT, "package.json"));
const { chromium } = require("playwright-core");
const FFMPEG = process.env.FFMPEG || "ffmpeg";
const FPS = 30, W = 1080, H = 1920;
const url = (p) => pathToFileURL(p).href;

const [lang = "en", kind = "pick", dateArg] = process.argv.slice(2);
const sky = await loadSky();
const HORO = sky.HORO_UI[lang];
const date = dateArg ? (([y, m, d]) => ({ y, m, d }))(dateArg.split("-").map(Number)) : sky.ymdIn(HORO.tz);
const iso = `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
const dateText = new Intl.DateTimeFormat(HORO.locale, { day: "numeric", month: "long", timeZone: "UTC" }).format(new Date(Date.UTC(date.y, date.m - 1, date.d)));
const TAROT = JSON.parse(fs.readFileSync(path.join(ROOT, "src/data/tarot.json"), "utf8"));

const V = {
  en: { pick: "Pick a card", pickSub: "Pause the video and choose 1, 2 or 3", card: "Card", signs: "Your horoscope today", cta: "Your own reading every morning", app: "Sussa · free on Google Play", strongest: "Strongest today" },
  tr: { pick: "Bir kart seç", pickSub: "Videoyu durdur, 1, 2 ya da 3'ü seç", card: "Kart", signs: "Bugün burcun ne diyor", cta: "Her sabah sana özel yorum", app: "Sussa · Google Play'de ücretsiz", strongest: "Bugün en güçlü" },
  pt: { pick: "Escolha uma carta", pickSub: "Pause o vídeo e escolha 1, 2 ou 3", card: "Carta", signs: "Seu horóscopo hoje", cta: "A sua leitura toda manhã", app: "Sussa · grátis no Google Play", strongest: "Mais forte hoje" },
  es: { pick: "Elige una carta", pickSub: "Pausa el video y elige 1, 2 o 3", card: "Carta", signs: "Tu horóscopo de hoy", cta: "Tu propia lectura cada mañana", app: "Sussa · gratis en Google Play", strongest: "Lo más fuerte hoy" },
  id: { pick: "Pilih satu kartu", pickSub: "Jeda videonya, pilih 1, 2 atau 3", card: "Kartu", signs: "Ramalan zodiakmu hari ini", cta: "Ramalanmu sendiri setiap pagi", app: "Sussa · gratis di Google Play", strongest: "Paling kuat hari ini" },
  vi: { pick: "Chọn một lá bài", pickSub: "Dừng video và chọn 1, 2 hoặc 3", card: "Lá", signs: "Tử vi của bạn hôm nay", cta: "Lời giải riêng cho bạn mỗi sáng", app: "Sussa · miễn phí trên Google Play", strongest: "Mạnh nhất hôm nay" },
}[lang];

const CSS = `
@font-face { font-family: Display; src: url(${url(path.join(A, "PlayfairDisplay-Bold.ttf"))}); }
@font-face { font-family: DisplayI; src: url(${url(path.join(A, "PlayfairDisplay-BoldItalic.ttf"))}); }
@font-face { font-family: Body; src: url(${url(path.join(A, "ArenaUI-Medium.ttf"))}); }
@font-face { font-family: BodyB; src: url(${url(path.join(A, "ArenaUI-Heavy.ttf"))}); }
* { margin: 0; box-sizing: border-box; }
body { width: ${W}px; height: ${H}px; overflow: hidden; color: #FFF3E4; font-family: Body; background: #0E0A24 url(${url(path.join(A, "bg_reading.jpg"))}) center/cover; }
.shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(14,10,36,.55), rgba(14,10,36,.35) 40%, rgba(14,10,36,.8)); }
.layer { position: absolute; inset: 0; opacity: 0; }
.cap { font-family: BodyB; letter-spacing: .2em; text-transform: uppercase; color: #F6C766; font-size: 34px; }
.h { font-family: Display; line-height: 1.08; }
.i { font-family: DisplayI; line-height: 1.25; }
.brand { position: absolute; left: 0; right: 0; bottom: 120px; text-align: center; font-family: BodyB; font-size: 30px; letter-spacing: .3em; color: rgba(246,199,102,.85); }
.back { border-radius: 26px; border: 4px solid #F6C766; background: radial-gradient(circle at 50% 50%, #3B2477, #1A1140 70%); box-shadow: 0 30px 80px rgba(0,0,0,.6); display: grid; place-items: center; }
.back::after { content: "✦"; color: #F6C766; font-size: 120px; }
.face { border-radius: 26px; border: 4px solid #F6C766; box-shadow: 0 30px 80px rgba(0,0,0,.6); background-size: cover; background-position: center; }
`;

// ------------------------------------------------------------------------------------------------ scenes
function pickScene() {
  // three different cards of the day from the whole deck (majors and minors), the same for every viewer
  const picks = []; let k = 0;
  while (picks.length < 3) { const h = sky.hash(date.y * 400 + date.m * 31 + date.d, 77, k++); const n = h % 78; if (!picks.some((p) => p.n === n)) picks.push({ n, rev: ((h >>> 9) % 5) === 0 }); }
  const cards = picks.map((p) => { const c = TAROT[p.n], t = c.t[lang]; return { ...p, name: t.name, text: p.rev ? t.rev : t.up, img: url(path.join(ROOT, "public/tarot", `${String(p.n).padStart(2, "0")}.webp`)) }; });
  const T = { intro: 0, pause: 4.2, reveal: [6.5, 14, 21.5], cta: 29, end: 33 };
  const html = `
  <div class="layer" id="intro" style="opacity:1">
    <div style="position:absolute;top:230px;left:0;right:0;text-align:center"><div class="cap">${dateText}</div><div class="h" style="font-size:118px;margin-top:26px">${V.pick}</div></div>
    ${[0, 1, 2].map((i) => `<div class="back" id="b${i}" style="position:absolute;width:300px;height:500px;top:720px;left:${75 + i * 330}px"></div>
      <div id="n${i}" style="position:absolute;top:1250px;left:${75 + i * 330}px;width:300px;text-align:center;font-family:Display;font-size:110px;color:#F6C766">${i + 1}</div>`).join("")}
    <div id="sub" style="position:absolute;top:1460px;left:90px;right:90px;text-align:center;font-family:BodyB;font-size:46px;color:#E7DFF7">${V.pickSub}</div>
  </div>
  ${cards.map((c, i) => `<div class="layer" id="r${i}">
    <div style="position:absolute;top:150px;left:0;right:0;text-align:center" class="cap">${V.card} ${i + 1}</div>
    <div id="f${i}" style="position:absolute;top:240px;left:${(W - 520) / 2}px;width:520px;height:860px;perspective:2000px">
      <div id="fi${i}" style="position:absolute;inset:0;transform-style:preserve-3d">
        <div class="back" style="position:absolute;inset:0;backface-visibility:hidden"></div>
        <div class="face" style="position:absolute;inset:0;backface-visibility:hidden;transform:rotateY(180deg) ${c.rev ? "rotateZ(180deg)" : ""};background-image:url(${c.img})"></div>
      </div>
    </div>
    <div id="t${i}" style="position:absolute;top:1150px;left:80px;right:80px;text-align:center">
      <div class="h" style="font-size:76px">${c.name}${c.rev ? ` <span style="font-size:44px;color:#F6C766">(${HORO.reversed})</span>` : ""}</div>
      <div class="i" style="font-size:46px;margin-top:28px;color:#F3EAFB">${c.text}</div>
    </div>
  </div>`).join("")}
  ${ctaLayer()}`;
  const seek = `(t) => {
    const T = ${JSON.stringify(T)}, cl = (x) => Math.max(0, Math.min(1, x)), ease = (x) => x < .5 ? 2*x*x : 1 - Math.pow(-2*x + 2, 2) / 2;
    const $ = (id) => document.getElementById(id);
    $("intro").style.opacity = cl((T.reveal[0] - t) / .5);
    for (let i = 0; i < 3; i++) {
      const a = ease(cl((t - .4 - i * .35) / .7));
      $("b" + i).style.transform = "translateY(" + (1 - a) * 160 + "px) rotate(" + ((i - 1) * 6 * a) + "deg)"; $("b" + i).style.opacity = a;
      $("n" + i).style.opacity = cl((t - 1.4 - i * .3) / .5);
      const s = T.reveal[i], e = i < 2 ? T.reveal[i + 1] : T.cta;
      $("r" + i).style.opacity = cl((t - s) / .4) * cl((e - t) / .4);
      const flip = ease(cl((t - s - .5) / .9));
      $("fi" + i).style.transform = "rotateY(" + flip * 180 + "deg) scale(" + (0.92 + 0.08 * flip) + ")";
      $("t" + i).style.opacity = cl((t - s - 1.3) / .6); $("t" + i).style.transform = "translateY(" + (1 - cl((t - s - 1.3) / .6)) * 40 + "px)";
    }
    $("sub").style.opacity = cl((t - T.pause) / .5) * (0.75 + 0.25 * Math.sin(t * 5));
    $("cta").style.opacity = cl((t - T.cta) / .5);
  }`;
  const meta = {
    title: `${V.pick} 🔮 ${dateText} #tarot #shorts`.slice(0, 100),
    lines: cards.map((c, i) => `${i + 1}: ${c.name}${c.rev ? ` (${HORO.reversed})` : ""}`),
  };
  return { html, seek, dur: T.end, meta };
}

function signsScene() {
  const per = 3.2, start = 3.2, cta = start + 12 * per;
  const rows = sky.SIGNS.map((s, i) => {
    const w = sky.weather(i, date), r = sky.daily(lang, i, date);
    const meters = [["love", w.love], ["career", w.career], ["money", w.money], ["energy", w.energy]].sort((a, b) => b[1] - a[1]);
    return { i, name: sky.t(lang, `sign.${s}.name`), open: r.open, best: [sky.t(lang, `home.${meters[0][0]}`), meters[0][1]], img: url(path.join(ROOT, "public/signs", `${String(i).padStart(2, "0")}.webp`)) };
  });
  const html = `
  <div class="layer" id="intro" style="opacity:1"><div style="position:absolute;top:620px;left:80px;right:80px;text-align:center">
    <div class="cap">${dateText}</div><div class="h" style="font-size:112px;margin-top:30px">${V.signs}</div></div></div>
  ${rows.map((r) => `<div class="layer" id="s${r.i}">
    <img src="${r.img}" style="position:absolute;top:260px;left:${(W - 520) / 2}px;width:520px;height:520px;border-radius:50%;border:5px solid #F6C766;box-shadow:0 30px 80px rgba(0,0,0,.6)">
    <div style="position:absolute;top:860px;left:80px;right:80px;text-align:center">
      <div class="h" style="font-size:110px">${r.name}</div>
      <div class="i" style="font-size:54px;margin-top:36px;color:#F3EAFB">${r.open}</div>
      <div style="margin-top:50px;font-family:BodyB;font-size:40px;color:#F6C766">${V.strongest}: ${r.best[0]} ${r.best[1]}%</div>
    </div></div>`).join("")}
  ${ctaLayer()}`;
  const seek = `(t) => {
    const cl = (x) => Math.max(0, Math.min(1, x)), $ = (id) => document.getElementById(id);
    $("intro").style.opacity = cl((${start} - t) / .4);
    for (let i = 0; i < 12; i++) { const s = ${start} + i * ${per}, e = s + ${per};
      const o = cl((t - s) / .3) * cl((e - t) / .3); $("s" + i).style.opacity = o; $("s" + i).style.transform = "scale(" + (1.04 - 0.04 * cl((t - s) / ${per})) + ")"; }
    $("cta").style.opacity = cl((t - ${cta}) / .4);
  }`;
  return { html, seek, dur: cta + 4, meta: { title: `${V.signs} · ${dateText} ✨ #horoscope #shorts`.slice(0, 100), lines: rows.map((r) => `${r.name}: ${r.open}`) } };
}

function ctaLayer() {
  return `<div class="layer" id="cta">
    <img src="${url(path.join(A, "pose_cards.png"))}" style="position:absolute;top:260px;left:${(W - 600) / 2}px;width:600px;height:880px;object-fit:contain;object-position:bottom;-webkit-mask-image:linear-gradient(#000 80%,transparent)">
    <div style="position:absolute;top:1190px;left:80px;right:80px;text-align:center">
      <div class="h" style="font-size:84px">${V.cta}</div>
      <div style="margin-top:40px;display:inline-block;padding:26px 48px;border-radius:999px;background:#FF6B57;font-family:BodyB;font-size:44px">${V.app}</div>
    </div></div>`;
}

// ------------------------------------------------------------------------------------------------ render
// kind = concept name + optional episode number (growth/plan.json), e.g. "chat1", "sky", "rank2"
const [, cname, cep] = kind.match(/^([a-z]+)(\d*)$/) || [, kind, ""];
const ctx = { sky, lang, date, dateText, HORO, TAROT, V, A, W, url, ROOT,
  cardImg: (n) => url(path.join(ROOT, "public/tarot", `${String(n).padStart(2, "0")}.webp`)), signImg: (i) => url(path.join(ROOT, "public/signs", `${String(i).padStart(2, "0")}.webp`)) };
const builders = concepts(ctx);
const scene = kind === "signs" ? signsScene() : kind === "pick" ? pickScene() : builders[cname] ? builders[cname](+(cep || 1)) : (() => { throw new Error("unknown kind " + kind); })();
if (scene.title) scene.meta = { title: scene.title.slice(0, 100), lines: scene.lines };
const outDir = path.join(G, "out", iso); fs.mkdirSync(outDir, { recursive: true });
const base = path.join(outDir, `${lang}_${kind}`);
const htmlFile = base + ".html";
fs.writeFileSync(htmlFile, `<!doctype html><html lang="${lang}"><head><meta charset="utf-8"><style>${CSS}</style></head><body${scene.bg ? ` style="background:${scene.bg}"` : ""}>${scene.bg ? "" : '<div class="shade"></div>'}${scene.html}<div class="brand"${scene.bg ? ' style="color:rgba(120,90,40,.55)"' : ""}>SUSSA</div><script>${scene.extra || ""}
window.seek = ${scene.seek || RUNTIME};</script></body></html>`);

const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.goto(url(htmlFile)); await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => Promise.all([...document.images].map((i) => i.decode().catch(() => {}))));
// PREVIEW="2,9.5,20" saves stills at those seconds next to the video path instead of rendering it (layout checks)
if (process.env.PREVIEW) {
  for (const s of process.env.PREVIEW.split(",")) { await page.evaluate((t) => window.seek(t), +s); await page.screenshot({ path: `${base}_${s}.png` }); }
  await browser.close(); fs.unlinkSync(htmlFile); console.log("preview", base, scene.dur.toFixed(1) + "s", scene.meta.title); process.exit(0);
}
const frames = Math.round(scene.dur * FPS);
const ff = spawn(FFMPEG, ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-i", path.join(A, "ambient.m4a"),
  "-filter_complex", `[1:a]afade=t=in:d=1,afade=t=out:st=${scene.dur - 1.5}:d=1.5,volume=0.8[a];[0:v]scale=out_color_matrix=bt709:out_range=tv,format=yuv420p[v]`, "-map", "[v]", "-map", "[a]", "-shortest",
  // high-bitrate BT.709 master: YouTube re-encodes everything, and a thin source turns the dark gradients into blocks
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-preset", "slow", "-crf", "12", "-maxrate", "16M", "-bufsize", "32M", "-g", "60",
  "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", "-color_range", "tv",
  "-c:a", "aac", "-b:a", "192k", "-ar", "48000", "-movflags", "+faststart", base + ".mp4"], { stdio: ["pipe", "inherit", "inherit"] });
for (let f = 0; f < frames; f++) {
  await page.evaluate((t) => window.seek(t), f / FPS);
  const buf = await page.screenshot({ type: "jpeg", quality: 100 });
  if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once("drain", r));
}
ff.stdin.end();
await new Promise((r, j) => ff.on("close", (c) => (c === 0 ? r() : j(new Error("ffmpeg " + c)))));
await browser.close();
fs.unlinkSync(htmlFile);

// title, description and tags for the upload; the store link carries a campaign so Play Console shows installs per video type
const play = `https://play.google.com/store/apps/details?id=app.sussa.bestie&referrer=${encodeURIComponent(`utm_source=youtube&utm_medium=shorts&utm_campaign=${kind}_${lang}`)}`;
const web = `https://asksussa.com/${lang}/${["signs", "rank", "lucky", "pov", "sky", "retro", "chat", "notes", "element"].includes(cname) ? "horoscope" : cname === "compat" ? "compatibility" : "tarot"}`;
const tags = { en: ["tarot", "pick a card", "horoscope", "astrology", "zodiac"], tr: ["tarot", "kart seç", "burç yorumları", "astroloji", "günlük burç"], pt: ["tarot", "escolha uma carta", "horóscopo", "astrologia", "signos"], es: ["tarot", "elige una carta", "horóscopo", "astrología", "signos"], id: ["tarot", "pilih kartu", "ramalan zodiak", "astrologi", "zodiak"], vi: ["tarot", "chọn một lá bài", "tử vi", "cung hoàng đạo", "chiêm tinh"] }[lang];
fs.writeFileSync(base + ".json", JSON.stringify({
  title: scene.meta.title, lang, kind, date: iso,
  description: `${scene.meta.lines.join("\n")}\n\n${V.cta}: ${play}\n${web}\n\n#${tags.map((x) => x.replace(/\s+/g, "")).join(" #")}`,
  tags,
}, null, 2));
console.log(base + ".mp4", frames, "frames");
