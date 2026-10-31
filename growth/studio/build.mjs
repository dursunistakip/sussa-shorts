// Studio Shorts: one video from a format, a language and a date.
//   node growth/studio/build.mjs <lang> <format> <YYYY-MM-DD> [outDir]
// script (Gemini, real-sky facts) -> voice (Gemini TTS) -> word timings (faster-whisper) -> footage cut from the Veo library
// -> HTML motion layer rendered frame by frame -> <lang>_s<format>.mp4 (YouTube) + .tiktok.mp4 (same mix, smaller for Telegram) + .json
// env: FFMPEG, PW_REQUIRE, CHROME, PYTHON, STUDIO_LIB (clips + music, default growth/studio/lib), WHISPER_DIR, VERTEX_SA_JSON
import fs from "fs"; import path from "path"; import { createRequire } from "module"; import { spawn, execFileSync } from "child_process"; import { fileURLToPath } from "url";
import { loadSky } from "../sky-loader.mjs"; import { skyFacts } from "./facts.mjs"; import { plan, setSignNames, verdictOf } from "./formats.mjs";
import { writeScript } from "./script.mjs"; import { tts } from "./vertex.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.join(HERE, "../.."), A = path.join(HERE, "../assets");
const LIB = process.env.STUDIO_LIB || path.join(HERE, "lib"), FFMPEG = process.env.FFMPEG || "ffmpeg", PY = process.env.PYTHON || "python";
const FPS = 30, W = 1080, H = 1920, TEMPO = 1.07, LEAD = 0.35, END = 2.9;
const [lang, fmt, iso, outArg] = process.argv.slice(2);
const OUT = outArg || path.join(HERE, "../out", iso); fs.mkdirSync(OUT, { recursive: true });
const name = `${lang}_s${fmt}`, WORK = path.join(OUT, `.${name}`); fs.mkdirSync(WORK, { recursive: true });
const url = (p) => "file:///" + path.resolve(p).replace(/\\/g, "/");
const ff = (args) => execFileSync(FFMPEG, ["-y", "-loglevel", "error", ...args], { stdio: "inherit" });
// STUDIO_LIBRARY: another clip list (e.g. only filmed stock footage); a clip without "src" is Veo-generated
const LIBJ = JSON.parse(fs.readFileSync(process.env.STUDIO_LIBRARY || path.join(HERE, "library.json"), "utf8"));
const END_TXT = { en: ["your daily tarot & real-sky horoscope", "Free on Google Play", "Your own reading every morning:"],
  tr: ["günlük tarot ve gerçek gökyüzü burç yorumu", "Google Play'de ücretsiz", "Her sabah sana özel yorum:"],
  pt: ["seu tarot diário e horóscopo pelo céu real", "Grátis no Google Play", "Sua leitura pessoal toda manhã:"],
  es: ["tu tarot diario y horóscopo con el cielo real", "Gratis en Google Play", "Tu lectura personal cada mañana:"],
  id: ["tarot harian & ramalan dari langit asli", "Gratis di Google Play", "Bacaan pribadimu setiap pagi:"],
  vi: ["tarot mỗi ngày & tử vi theo bầu trời thật", "Miễn phí trên Google Play", "Lá bài của riêng bạn mỗi sáng:"] }[lang];

// ---------------------------------------------------------------- deterministic randomness + usage history (no repeats)
let seed = [...`${iso}|${lang}|${fmt}`].reduce((h, c) => (Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0), 2166136261) % 2147483647 || 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const HIST = path.join(HERE, "history.json"), hist = fs.existsSync(HIST) ? JSON.parse(fs.readFileSync(HIST, "utf8")) : {};
const mine = (hist[lang] ||= { clips: [], cards: [], topics: [] });
const daysAgo = (d) => (Date.parse(iso) - Date.parse(d)) / 864e5;
const used = { cards: mine.cards.filter(([d]) => daysAgo(d) < 14).map((x) => x[1]), topics: mine.topics.filter(([d]) => daysAgo(d) < 45).map((x) => x[1]) };

// ---------------------------------------------------------------- script
const sky = await loadSky(); setSignNames((s) => sky.SIGNS[s]);
const [y, m, d] = iso.split("-").map(Number), facts = skyFacts(sky, { y, m, d });
const P = plan(fmt, rnd, used);
const scriptFile = path.join(WORK, "script.json");
const S = fs.existsSync(scriptFile) ? JSON.parse(fs.readFileSync(scriptFile, "utf8")) : await writeScript({ lang, fmt, plan: P, facts });
fs.writeFileSync(scriptFile, JSON.stringify(S, null, 1));
const signName = (s) => sky.t(lang, `sign.${sky.SIGNS[s]}.name`);

// ---------------------------------------------------------------- voice (one take per segment) + word timings
const STYLE = "Read this like a warm, slightly playful young woman talking to a close friend on TikTok. Natural, intimate, a little mysterious, lively pace, never like an announcer:";
const segs = P.segs.map((s, k) => ({ ...s, ...S.segments[s.id], k, words: S.segments[s.id].vo.trim().split(/\s+/), wav: path.join(WORK, `vo_${k}.wav`), al: path.join(WORK, `al_${k}.json`) }));
await Promise.all(segs.map((s) => (fs.existsSync(s.wav) ? null : tts(s.vo.trim(), s.wav, { style: STYLE }))));
const jobs = segs.filter((s) => !fs.existsSync(s.al)).map((s) => ({ wav: s.wav, words: s.words, out: s.al }));
if (jobs.length) {
  fs.writeFileSync(path.join(WORK, "jobs.json"), JSON.stringify(jobs));
  execFileSync(PY, [path.join(HERE, "align.py"), path.join(WORK, "jobs.json"), ...(process.env.WHISPER_DIR ? [process.env.WHISPER_DIR] : [])], { stdio: "inherit" });
}
// timeline: each segment = lead-in + its voice (sped up by TEMPO) + a breath; the pick hook waits until the cards are down
const LEADIN = { hook: .3, card: .55, item: .25, pair: .3, text: .3, cta: .35 }, BREATH = .25;
const words = []; let clock = 0;
for (const s of segs) {
  const al = JSON.parse(fs.readFileSync(s.al, "utf8"));
  s.start = clock; s.voAt = clock + LEADIN[s.type];
  s.words.forEach((w, i) => words.push({ w, seg: s.k, a: s.voAt + al.times[i][0] / TEMPO, b: s.voAt + al.times[i][1] / TEMPO }));
  s.dur = LEADIN[s.type] + al.total / TEMPO + (s.type === "cta" ? END : BREATH);
  if (s.clip === "r_lay") s.dur = Math.max(s.dur, 6.2);
  if (s.type === "card") s.dur = Math.max(s.dur, 3.2);
  s.end = clock + s.dur; clock = s.end;
}
const total = Math.round(clock * 100) / 100;

// ---------------------------------------------------------------- segments and footage pieces
const recent = mine.clips.filter(([dd]) => daysAgo(dd) < 7).map((x) => x[1]), inVideo = [];
const pickClip = (moods) => {
  const pool = Object.entries(LIBJ.clips).filter(([id, c]) => id !== "r_lay" && c.moods.some((mm) => moods.includes(mm))).map(([id]) => id);
  const score = (id) => inVideo.filter((x) => x === id).length * 100 + recent.filter((x) => x === id).length * 3 + rnd();
  const id = pool.sort((p, q) => score(p) - score(q))[0]; inVideo.push(id); return id;
};
const pieces = [];
const piece = (clip, start, dur, opts = {}) => {
  const c = LIBJ.clips[clip], [r0, r1] = c.range || [0, 8], avail = r1 - r0;
  const speed = opts.speed ?? Math.max(0.6, Math.min(1, avail / dur)), need = dur * speed;
  const from = opts.from ?? r0 + rnd() * Math.max(0, avail - need);
  pieces.push({ clip, start, dur, from, speed, mirror: opts.mirror ?? (clip.startsWith("p_") || clip.startsWith("cta") ? rnd() < .35 : rnd() < .5),
    zoom: opts.zoom ?? 1 + rnd() * .12, px: rnd(), py: rnd() });
};
for (const s of segs) {
  const moods = s.type === "hook" ? (s.clip === "sky" ? ["sky"] : s.clip === "ritual" || !s.clip ? (["rank", "signsas", "compat", "weekly", "pov"].includes(fmt) ? ["fun", "love", "self", "power"] : ["ritual"]) : ["ritual"])
    : s.type === "cta" ? ["cta"] : s.type === "card" && s.mood === undefined ? ["calm"] : fmt === "sky" ? ["sky", s.mood] : [s.mood || "calm"];
  if (s.clip === "r_lay") { const from = Math.max(0, 5.4 - (s.dur - 1.2)); piece("r_lay", s.start, s.dur, { from, speed: 1, mirror: false, zoom: 1 }); s.numbersAt = 4.6 - from; continue; }
  const n = s.type === "cta" ? 1 : s.dur > 6.2 ? 2 : 1;
  for (let i = 0; i < n; i++) piece(pickClip(i === 0 ? moods : s.type === "card" ? ["ritual", ...moods] : moods), s.start + (s.dur / n) * i, s.dur / n);
}

// ---------------------------------------------------------------- background frames
const BG = path.join(WORK, "bg"); fs.rmSync(BG, { recursive: true, force: true }); fs.mkdirSync(BG);
for (const p of pieces) {
  const n0 = Math.round(p.start * FPS), n1 = Math.round((p.start + p.dur) * FPS), count = n1 - n0;
  const cw = `iw/${p.zoom.toFixed(3)}`, ch = `ih/${p.zoom.toFixed(3)}`;
  const vf = [`trim=start=${p.from.toFixed(3)}:duration=${(p.dur * p.speed + 0.2).toFixed(3)}`, `setpts=(PTS-STARTPTS)/${p.speed.toFixed(4)}`, `fps=${FPS}`,
    ...(p.mirror ? ["hflip"] : []), `crop=${cw}:${ch}:(iw-${cw})*${p.px.toFixed(3)}:(ih-${ch})*${p.py.toFixed(3)}`, `scale=${W}:${H}`,
    "eq=contrast=1.05:saturation=1.08:gamma=0.97", "unsharp=5:5:0.4"].join(",");
  ff(["-i", path.join(LIB, p.clip + ".mp4"), "-vf", vf, "-frames:v", String(count), "-fps_mode", "passthrough", "-q:v", "2", "-start_number", String(n0), path.join(BG, "%05d.jpg")]);
  for (let k = n0; k < n1; k++) { const f = path.join(BG, String(k).padStart(5, "0") + ".jpg"); if (!fs.existsSync(f)) fs.copyFileSync(path.join(BG, String(k - 1).padStart(5, "0") + ".jpg"), f); }
}

// ---------------------------------------------------------------- audio: YouTube mix (music) and TikTok mix (voice + sfx)
const SFX = path.join(HERE, "assets/sfx");
const fx = [...pieces.slice(1).map((p) => ["whoosh", p.start - .15, .4]), ...segs.filter((s) => s.type === "card").flatMap((s) => [["flip", s.start + .45, .55], ["reveal", s.start + .6, .5]]),
  ["chime", total - END + .2, .5], ...(segs[0].clip === "r_lay" || pieces[0].clip.startsWith("r_") ? [["shuffle", .25, .45]] : [])];
const music = LIBJ.music[Math.floor(rnd() * LIBJ.music.length)];
function mix(withMusic, out) {
  const ins = [], f = [];
  segs.forEach((sg, i) => { ins.push("-i", sg.wav); const ms = Math.round(sg.voAt * 1000); f.push(`[${i}:a]atempo=${TEMPO},aresample=48000,aformat=channel_layouts=stereo,adelay=${ms}|${ms}[v${i}]`); });
  f.push(`${segs.map((_, i) => `[v${i}]`).join("")}amix=inputs=${segs.length}:normalize=0,highpass=f=80,acompressor=threshold=-18dB:ratio=3:attack=5:release=80,volume=1.6,asplit=2[voice][key]`);
  const tail = [];
  fx.forEach(([nm, at, vol], j) => { ins.push("-i", path.join(SFX, nm + ".wav")); const ms = Math.round(Math.max(0, at) * 1000); f.push(`[${j + segs.length}:a]aresample=48000,aformat=channel_layouts=stereo,volume=${vol},adelay=${ms}|${ms}[f${j}]`); tail.push(`[f${j}]`); });
  if (withMusic) {
    ins.push("-i", path.join(LIB, music + ".wav")); const mi = fx.length + segs.length;
    f.push(`[${mi}:a]aresample=48000,aformat=channel_layouts=stereo,aloop=loop=3:size=2000000,atrim=0:${total},volume=0.5,afade=t=in:d=0.3,afade=t=out:st=${total - 1.5}:d=1.5[mus]`, "[mus][key]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[duck]");
    tail.unshift("[duck]");
  } else f.push("[key]anullsink");
  f.push(`[voice]${tail.join("")}amix=inputs=${tail.length + 1}:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=9,atrim=0:${total}[out]`);
  ff([...ins, "-filter_complex", f.join(";"), "-map", "[out]", "-c:a", "aac", "-b:a", "192k", "-ar", "48000", out]);
}
mix(true, path.join(WORK, "yt.m4a"));

// ---------------------------------------------------------------- captions (max 3 words, never across a segment)
const chunks = []; let cur = [];
words.forEach((w, i) => { cur.push(w); const nx = words[i + 1]; if (cur.length === 3 || /[.,?!…:;]$/.test(w.w) || !nx || nx.seg !== w.seg) { chunks.push(cur); cur = []; } });
chunks.forEach((c, i) => { const e = c.at(-1).b, nx = chunks[i + 1]?.[0].a ?? e + .6; c.until = Math.min(nx, e + .6); });

// ---------------------------------------------------------------- motion layer
const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;");
const VERD = { yes: "#5BE38E", no: "#FF6B6B", wait: "#FFD27A" };
const back = `<div class="back"><div class="bi"><svg viewBox="0 0 100 100" width="90"><path d="M50 8 L58 42 L92 50 L58 58 L50 92 L42 58 L8 50 L42 42Z" fill="#E7C27A"/></svg></div></div>`;
const medal = (s, sz) => `<div class="med" style="width:${sz}px;height:${sz}px"><img src="${url(path.join(ROOT, "public/signs", String(s).padStart(2, "0") + ".webp"))}"></div>`;
const segHtml = (s) => {
  const id = `S${s.k}`;
  if (s.type === "hook") return `<div class="layer seg" id="${id}"><div class="abs top"><div class="pill" id="${id}a">${esc(s.kicker)}</div><div class="big" id="${id}b" style="margin-top:26px">${esc(s.headline)}</div></div>
    ${s.numbersAt !== undefined ? [264, 572, 888].map((x, i) => `<div class="abs num" id="${id}n${i}" style="left:${x - 56}px;top:760px">${i + 1}</div>`).join("") : ""}</div>`;
  if (s.type === "card") return `<div class="layer seg" id="${id}"><div class="abs top">${s.label ? `<div class="pill" id="${id}a">${s.label}</div>` : `<div id="${id}a"></div>`}<div class="big" id="${id}b" style="margin-top:18px;font-size:84px">${esc(s.name)}</div></div>
    <div class="abs cardwrap" id="${id}w"><div class="card" id="${id}c">${back}<div class="face" style="background-image:url(${url(path.join(HERE, "assets/cards", String(s.card).padStart(2, "0") + ".jpg"))})"><div class="shine" id="${id}s"></div></div></div></div>
    ${s.verdict ? `<div class="abs verdict" id="${id}v" style="color:${VERD[verdictOf(s.card)]}">${esc(s.verdict)}</div>` : ""}
    ${Array.from({ length: 14 }, (_, j) => `<div class="abs spark" id="${id}x${j}"></div>`).join("")}</div>`;
  if (s.type === "item") return `<div class="layer seg" id="${id}"><div class="abs top" id="${id}a">${s.badge ? `<div class="badge">${s.badge}</div>` : ""}${medal(s.sign, s.fast ? 200 : 240)}
    <div class="big" style="font-family:Display;font-style:normal;font-size:${s.fast ? 80 : 92}px;margin-top:14px">${esc(signName(s.sign))}</div><div class="line" id="${id}b">${esc(s.line)}</div></div></div>`;
  if (s.type === "pair") return `<div class="layer seg" id="${id}"><div class="abs top" id="${id}a"><div style="display:flex;justify-content:center;align-items:center;gap:30px">${medal(s.signs[0], 200)}<div class="plus">+</div>${medal(s.signs[1], 200)}</div>
    <div class="big" style="font-family:Display;font-style:normal;font-size:72px;margin-top:16px">${esc(signName(s.signs[0]))} + ${esc(signName(s.signs[1]))}</div>
    <div style="margin-top:22px"><span class="pct">${sky.compatibility(s.signs[0], s.signs[1])}%</span></div><div class="line" id="${id}b">${esc(s.line)}</div></div></div>`;
  if (s.type === "text") return `<div class="layer seg" id="${id}"><div class="abs top"><div class="pill" id="${id}a">${esc(s.kicker)}</div><div class="big" id="${id}b" style="margin-top:26px;font-size:80px">${esc(s.heading)}</div></div></div>`;
  return `<div class="layer seg" id="${id}"><div class="abs phone" id="ph"><div class="screen">${[0, 1, 2].map((i) => `<img id="sc${i}" src="${url(path.join(HERE, "assets/shots", `${lang}_${i}.jpg`))}">`).join("")}</div></div></div>`;
};
const bgCount = fs.readdirSync(BG).length;
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Display; src: url(${url(A + "/PlayfairDisplay-Bold.ttf")}); }
@font-face { font-family: DisplayI; src: url(${url(A + "/PlayfairDisplay-BoldItalic.ttf")}); }
@font-face { font-family: Body; src: url(${url(A + "/ArenaUI-Medium.ttf")}); }
@font-face { font-family: BodyB; src: url(${url(A + "/ArenaUI-Heavy.ttf")}); }
* { margin: 0; box-sizing: border-box; }
body { width: ${W}px; height: ${H}px; overflow: hidden; background: #000; color: #fff; font-family: Body; }
.abs { position: absolute; } .layer { position: absolute; inset: 0; } .seg { display: none; }
.top { top: 200px; left: 60px; right: 60px; text-align: center; }
#bg { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; transform-origin: 50% 45%; }
#vig { background: radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 45%, rgba(0,0,0,.55) 100%), linear-gradient(180deg, rgba(8,4,20,.6) 0%, rgba(8,4,20,0) 26%, rgba(8,4,20,0) 58%, rgba(8,4,20,.6) 100%); }
#flash { background: #fff; opacity: 0; mix-blend-mode: screen; } #grain { opacity: .09; mix-blend-mode: overlay; }
.pill { font-family: BodyB; font-size: 30px; letter-spacing: 6px; color: #1A0F2E; background: #E7C27A; padding: 12px 28px; border-radius: 999px; display: inline-block; text-transform: uppercase; }
.big { font-family: DisplayI; font-size: 76px; line-height: 1.08; text-shadow: 0 4px 30px rgba(0,0,0,.7); }
.num { width: 112px; height: 112px; border-radius: 50%; border: 4px solid #E7C27A; background: rgba(14,8,30,.55); font-family: Display; font-size: 64px; color: #FFE3A3; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 40px rgba(231,194,122,.55); }
.badge { display: inline-block; font-family: Display; font-size: 64px; color: #1A0F2E; background: #E7C27A; border-radius: 999px; padding: 4px 34px; margin-bottom: 18px; box-shadow: 0 0 40px rgba(231,194,122,.5); }
.med { margin: 0 auto; border-radius: 50%; overflow: hidden; border: 5px solid #E7C27A; box-shadow: 0 0 50px rgba(231,194,122,.45), 0 20px 50px rgba(0,0,0,.5); background: #1A0F2E; }
.med img { width: 100%; height: 100%; object-fit: cover; }
.plus { font-family: Display; font-size: 90px; color: #FFE3A3; }
.pct { font-family: BodyB; font-size: 46px; color: #1A0F2E; background: #FFD27A; border-radius: 999px; padding: 10px 30px; }
.line { display: inline-block; margin-top: 26px; font-family: DisplayI; font-size: 52px; line-height: 1.15; padding: 18px 30px; border-radius: 26px; background: rgba(12,6,28,.55); backdrop-filter: blur(8px); }
.cap { left: 60px; right: 60px; top: 1330px; text-align: center; font-family: BodyB; font-size: 68px; line-height: 1.15; }
.cap span { display: inline-block; margin: 0 9px; color: #fff; -webkit-text-stroke: 10px rgba(0,0,0,.85); paint-order: stroke fill; text-shadow: 0 6px 18px rgba(0,0,0,.5); }
.cap span.on { color: #FFD27A; }
.cardwrap { left: 50%; top: 420px; width: 430px; height: 645px; margin-left: -215px; perspective: 1800px; }
.card { position: absolute; inset: 0; transform-style: preserve-3d; }
.face, .back { position: absolute; inset: 0; border-radius: 26px; backface-visibility: hidden; overflow: hidden; box-shadow: 0 30px 80px rgba(0,0,0,.6), 0 0 70px rgba(231,194,122,.45); }
.face { transform: rotateY(180deg); background: #111 center/cover; border: 6px solid #E7C27A; }
.back { background: #18213F; border: 6px solid #0E1530; display: flex; align-items: center; justify-content: center; }
.bi { position: absolute; inset: 22px; border: 3px solid #C9A45E; border-radius: 14px; display: flex; align-items: center; justify-content: center; }
.shine { position: absolute; inset: -40%; background: linear-gradient(115deg, rgba(255,255,255,0) 40%, rgba(255,240,200,.55) 50%, rgba(255,255,255,0) 60%); }
.spark { width: 14px; height: 14px; border-radius: 50%; background: #FFE9B0; box-shadow: 0 0 18px 6px rgba(255,214,130,.8); }
.verdict { left: 0; right: 0; top: 1085px; text-align: center; font-family: BodyB; font-size: 120px; letter-spacing: 6px; text-transform: uppercase; -webkit-text-stroke: 10px rgba(0,0,0,.6); paint-order: stroke fill; text-shadow: 0 0 50px currentColor; }
.phone { left: 50%; width: 540px; height: 1080px; margin-left: -270px; top: 260px; border-radius: 72px; background: #0B0B10; padding: 16px; box-shadow: 0 40px 120px rgba(0,0,0,.7), 0 0 0 3px #2A2A35; }
.screen { position: relative; width: 100%; height: 100%; border-radius: 58px; overflow: hidden; background: #0E0A24; }
.screen img { position: absolute; left: 0; top: 0; width: 100%; }
#end { background: rgba(14,8,32,.86); display: flex; flex-direction: column; align-items: center; justify-content: center; opacity: 0; }
.cta { font-family: BodyB; font-size: 46px; color: #fff; background: #FF6B57; padding: 28px 56px; border-radius: 999px; box-shadow: 0 16px 50px rgba(255,107,87,.5); }
</style></head><body>
<img id="bg"><div class="layer" id="vig"></div>
${segs.map(segHtml).join("\n")}
<div class="abs cap" id="cap"></div>
<div class="layer" id="end">
  <img src="${url(path.join(A, "../studio/assets/icon.png"))}" style="width:230px;border-radius:52px;box-shadow:0 20px 60px rgba(0,0,0,.6)" id="ei">
  <div style="font-family:Display;font-size:128px;color:#F6C766;margin-top:34px" id="et">Sussa</div>
  <div style="font-family:Body;font-size:44px;color:#E7DFF7;margin-top:6px;text-align:center;padding:0 80px" id="es">${esc(END_TXT[0])}</div>
  <div class="cta" style="margin-top:70px" id="eb">${esc(END_TXT[1])}</div>
</div>
<div class="layer" id="flash"></div>
<div class="layer" id="grain" style="background-size:100% 100%"></div>
<script>
const SEGS = ${JSON.stringify(segs.map((s) => ({ k: s.k, type: s.type, start: s.start, dur: s.dur, numbersAt: s.numbersAt, fast: !!s.fast })))};
const CUTS = ${JSON.stringify(pieces.map((p) => p.start))}, TOTAL = ${total}, END = ${END};
const CH = ${JSON.stringify(chunks.map((c) => ({ w: c.map((x) => [x.a, x.b, x.w]), until: c.until })))};
const $ = (id) => document.getElementById(id), cl = (x) => Math.max(0, Math.min(1, x));
const eo = (x) => 1 - Math.pow(1 - cl(x), 3), eb = (x) => { x = cl(x); const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const show = (el, t, a, b = 1e9, fx = "up", d = .45) => { if (!el) return; const p = eo((t - a) / d), q = 1 - eo((t - b) / .3); el.style.opacity = Math.min(p, q);
  el.style.transform = fx === "up" ? \`translateY(\${(1 - p) * 40}px)\` : fx === "pop" ? \`scale(\${.4 + .6 * eb((t - a) / d)})\` : fx === "right" ? \`translateX(\${(1 - p) * 220}px)\` : ""; };
let seed = 1; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
// film grain: 8 noise frames made once, cycled (drawing fresh noise every frame was the slowest part of the render)
const GR = Array.from({ length: 8 }, (_, n) => { const c = document.createElement("canvas"); c.width = 540; c.height = 960; const x = c.getContext("2d"), d = x.createImageData(540, 960);
  seed = 11 + n * 7919; for (let i = 0; i < d.data.length; i += 4) { const v = rnd() * 255; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; } x.putImageData(d, 0, 0); return \`url(\${c.toDataURL("image/png")})\`; });
window.seek = async (t) => {
  const f = Math.min(${bgCount - 1}, Math.round(t * ${FPS})), img = $("bg");
  img.src = "${url(BG)}/" + String(f).padStart(5, "0") + ".jpg"; await img.decode();
  const seg = SEGS.findLast((s) => t >= s.start) || SEGS[0], lt = t - seg.start, cut = CUTS.findLast((c) => t >= c) || 0, ct = t - cut;
  img.style.transform = \`scale(\${(cut > 0 ? 1 + .12 * (1 - eo(ct / .4)) : 1) * (1 + .03 * ct / 6)})\`;
  $("flash").style.opacity = cut > 0 ? .5 * (1 - cl(ct / .2)) : 0;
  SEGS.forEach((s) => { $("S" + s.k).style.display = s === seg ? "block" : "none"; });
  const id = "S" + seg.k;
  if (seg.type === "hook") { show($(id + "a"), lt, .1); show($(id + "b"), lt, .3);
    if (seg.numbersAt !== undefined) [0, 1, 2].forEach((i) => { const el = $(id + "n" + i), a0 = seg.numbersAt + i * .18; show(el, lt, a0, 1e9, "pop", .4); if (lt > a0 + .5) el.style.transform = \`scale(\${1 + .05 * Math.sin((lt - a0) * 5 + i)})\`; }); }
  else if (seg.type === "card") {
    show($(id + "a"), lt, .3); show($(id + "b"), lt, 1.05);
    const w = $(id + "w"), c = $(id + "c"), enter = eo(lt / .45), flip = eo((lt - .45) / .6), settle = eo((lt - 3.2) / .8), fl = Math.sin(lt * 1.6) * 10;
    w.style.opacity = enter; w.style.transform = \`translateY(\${(1 - enter) * 160 + fl - settle * 50}px) scale(\${(.7 + .3 * enter) * (1 - .12 * settle)}) rotate(\${Math.sin(lt * 1.1) * 1.6}deg)\`;
    c.style.transform = \`rotateY(\${180 * flip}deg)\`; $(id + "s").style.transform = \`translateX(\${-100 + 200 * cl((lt - 1.1) / .8)}%)\`;
    if ($(id + "v")) show($(id + "v"), lt, 1.3, 1e9, "pop", .5);
    seed = 7 + seg.k;
    for (let j = 0; j < 14; j++) { const a = rnd() * 6.283, r = 220 + rnd() * 260, p = cl((lt - .75) / 1.1), sp = $(id + "x" + j);
      sp.style.left = 540 + Math.cos(a) * r * eo(p) - 7 + "px"; sp.style.top = 740 + Math.sin(a) * r * eo(p) * 1.3 - 7 + "px"; sp.style.opacity = p > 0 && p < 1 ? 1 - p : 0; sp.style.transform = \`scale(\${.5 + rnd()})\`; }
  }
  else if (seg.type === "item" || seg.type === "pair") { const d = seg.fast ? .3 : .45; show($(id + "a"), lt, 0, seg.dur - .25, "right", d); show($(id + "b"), lt, seg.fast ? .2 : .5, 1e9, "up", d); }
  else if (seg.type === "text") { show($(id + "a"), lt, .15); show($(id + "b"), lt, .4); }
  else if (seg.type === "cta") {
    const ph = $("ph"), p = eo((lt - .15) / .7), out = eo((lt - (seg.dur - END)) / .4);
    ph.style.transform = \`translateY(\${(1 - p) * 1200 + Math.sin(lt * 1.3) * 8}px) rotate(\${(1 - p) * 6}deg) scale(\${1 - .08 * out})\`; ph.style.opacity = 1 - out;
    const step = Math.max(1.6, (seg.dur - END) / 3);
    [0, 1, 2].forEach((i) => { const a = i * step, o = i === 0 ? 1 : eo((lt - a) / .35); $("sc" + i).style.opacity = o; $("sc" + i).style.top = -Math.max(0, lt - a) * 12 + "px"; });
  }
  const et = t - (TOTAL - END); $("end").style.opacity = eo(et / .4);
  show($("ei"), et, .1, 1e9, "pop", .5); show($("et"), et, .3); show($("es"), et, .45); show($("eb"), et, .6, 1e9, "pop", .5);
  if (et > 1.1) $("eb").style.transform = \`scale(\${1 + .035 * Math.sin((et - 1.1) * 6)})\`;
  const ch = et > 0 ? null : CH.find((c) => t >= c.w[0][0] - .05 && t < c.until), cap = $("cap");
  if (!ch) cap.innerHTML = ""; else {
    cap.innerHTML = ch.w.map((w) => \`<span class="\${t >= w[0] && t < w[1] + .08 ? "on" : ""}">\${w[2].replace(/&/g, "&amp;").replace(/</g, "&lt;")}</span>\`).join(" ");
    cap.style.transform = \`scale(\${.85 + .15 * eb((t - ch.w[0][0] + .05) / .14)})\`;
    cap.style.top = (seg.type === "cta" ? 1420 : seg.type === "hook" && seg.numbersAt !== undefined ? 1440 : seg.type === "item" || seg.type === "pair" ? 1360 : 1330) + "px";
  }
  $("grain").style.backgroundImage = GR[f % 8];
};
</script></body></html>`;
fs.writeFileSync(path.join(WORK, "page.html"), html);

// ---------------------------------------------------------------- render
const require = createRequire(process.env.PW_REQUIRE || path.join(ROOT, "package.json")); const { chromium } = require("playwright-core");
const browser = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {});
const page = await browser.newPage({ viewport: { width: W, height: H } });
await page.goto(url(path.join(WORK, "page.html"))); await page.evaluate(() => document.fonts.ready);
if (process.env.PREVIEW) {
  for (const s of process.env.PREVIEW.split(",")) { await page.evaluate((t) => window.seek(t), +s); await page.screenshot({ path: path.join(OUT, `${name}_${s}.jpg`), type: "jpeg", quality: 80 }); }
  await browser.close(); console.log("segments", segs.map((s) => `${s.id}@${s.start.toFixed(1)}`).join(" "), "total", total); process.exit(0);
}
const silent = path.join(WORK, "video.mp4"), nFrames = Math.round(total * FPS);
const enc = spawn(FFMPEG, ["-y", "-loglevel", "error", "-f", "image2pipe", "-framerate", String(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "14", "-maxrate", "16M", "-bufsize", "32M", "-g", "60",
  "-pix_fmt", "yuv420p", "-vf", "scale=out_color_matrix=bt709:out_range=tv", "-colorspace", "bt709", "-color_primaries", "bt709", "-color_trc", "bt709", silent], { stdio: ["pipe", "inherit", "inherit"] });
for (let i = 0; i < nFrames; i++) {
  await page.evaluate((t) => window.seek(t), i / FPS);
  const buf = await page.screenshot({ type: "jpeg", quality: 92 });
  if (!enc.stdin.write(buf)) await new Promise((r) => enc.stdin.once("drain", r));
  if (i % 300 === 0) console.log(`${name} frame ${i}/${nFrames}`);
}
enc.stdin.end(); await new Promise((r, j) => enc.on("close", (c) => (c === 0 ? r() : j(new Error("ffmpeg " + c))))); await browser.close();
const mp4 = path.join(OUT, `${name}.mp4`), tiktok = path.join(OUT, `${name}.tiktok.mp4`);
ff(["-i", silent, "-i", path.join(WORK, "yt.m4a"), "-map", "0:v", "-map", "1:a", "-c", "copy", "-shortest", "-movflags", "+faststart", mp4]);
// TikTok copy: same mix (music included, owner's call), ~6 Mbit/s keeps it under Telegram's 50 MB bot limit (TikTok re-encodes anyway)
ff(["-i", silent, "-i", path.join(WORK, "yt.m4a"), "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "slow", "-b:v", "6M", "-maxrate", "6.5M", "-bufsize", "12M",
  "-pix_fmt", "yuv420p", "-c:a", "copy", "-shortest", "-movflags", "+faststart", tiktok]);

// ---------------------------------------------------------------- upload metadata + history
const web = { pick: "tarot-reading", found: "tarot-reading", yesno: "tarot-reading", myth: "tarot", pov: "tarot-reading" }[fmt] || "horoscope";
const play = `https://play.google.com/store/apps/details?id=app.sussa.bestie&referrer=${encodeURIComponent(`utm_source=youtube&utm_medium=shorts&utm_campaign=s${fmt}_${lang}`)}`;
const [body, tagsLine = ""] = S.description.split(/\n\s*\n(?=#)/);
const description = `${body.trim()}\n\n${END_TXT[2]} ${play}\nhttps://asksussa.com/${lang}/${web}\n\n${tagsLine.trim()}`.trim();
const title = S.title.length > 100 ? S.title.slice(0, 97) + "…" : S.title;
fs.writeFileSync(path.join(OUT, `${name}.json`), JSON.stringify({ title, description, tags: S.tags, lang, kind: `s${fmt}`, date: iso, tiktok: S.tiktok,
  synthetic: pieces.some((p) => !LIBJ.clips[p.clip].src) }, null, 1));   // YouTube's altered-or-synthetic label only when Veo footage is in it
mine.clips.push(...inVideo.map((c) => [iso, c])); (P.cards || []).forEach((c) => mine.cards.push([iso, c])); if (P.topic) mine.topics.push([iso, P.topic]);
for (const k of ["clips", "cards", "topics"]) mine[k] = mine[k].filter(([dd]) => daysAgo(dd) < 60);
fs.writeFileSync(HIST, JSON.stringify(hist));
console.log("saved", mp4, `(${total}s, music ${music})`);
