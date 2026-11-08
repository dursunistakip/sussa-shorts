// TikTok countdown list video: "The 5 Most POWERFUL Zodiac Signs", rows fill from #5 to #2, then #1 lands last, highlighted.
//   node growth/tiktok/listvideo.mjs <lang> <YYYY-MM-DD> [outDir]      -> <outDir>/<lang>_list/video.mp4 + meta.json
// About 9 s, no audio: the owner adds a trending sound on the phone. Background: one mood photo with a slow push-in.
import fs from "fs"; import path from "path"; import { createRequire } from "module"; import { fileURLToPath } from "url"; import { execFileSync } from "child_process";
import { gemini, image } from "../studio/vertex.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url)), [lang, iso, outArg] = process.argv.slice(2);
const OUT = path.join(outArg || path.join(HERE, "../out", iso), `${lang}_list`); fs.mkdirSync(OUT, { recursive: true });
const url = (p) => "file:///" + path.resolve(p).replace(/\\/g, "/");
const LANG = { en: "American English", tr: "Türkçe", pt: "Brazilian Portuguese", es: "Mexican Spanish", id: "bahasa Indonesia", vi: "Vietnamese" }[lang];
let seed = [...`${iso}|${lang}|list`].reduce((h, c) => (Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0), 2166136261) % 2147483647 || 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const BACKS = ["sunlit modern city street with glass buildings, soft morning light, shallow depth of field", "night city skyline from a high window, warm lights bokeh",
  "golden hour light in a minimal white apartment with tall windows", "pink and lilac dusk sky over rooftops", "dark marble surface with a warm spotlight and soft shadows",
  "rainy window at night with blurred warm city lights"];

const scriptFile = path.join(OUT, "script.json");
const S = fs.existsSync(scriptFile) ? JSON.parse(fs.readFileSync(scriptFile, "utf8")) : await gemini(`You write viral TikTok countdown videos about zodiac signs for women 18-34, in ${LANG}.
Format: a top-5 list whose rows fill from #5 up to #1, so viewers wait for #1 and then comment their own sign.
- The title names a trait people are proud of, secretly identify with, or love to argue about (powerful, loyal, intimidating, hardest to forget, most likely to become rich, love the hardest, best liars). One word in CAPS. Title Case. Max 7 words. Example: "The 5 Most POWERFUL Zodiac Signs".
- First write 10 titles in "titles", then put the one most people would stop for in "title".
- #1 must be a sign people will debate in the comments, not the obvious pick. No sign twice.
Return JSON: {"titles":[10],"title":"...","list":["sign for #1","#2","#3","#4","#5"],"caption":"short caption that asks people to comment their sign + 3-4 hashtags"}`);
fs.writeFileSync(scriptFile, JSON.stringify(S, null, 1));
if (process.env.SCRIPT_ONLY) process.exit(0);

const bg = path.join(OUT, "bg.jpg");
if (!fs.existsSync(bg)) {
  const scene = BACKS[Math.floor(rnd() * BACKS.length)];
  try { await image("Aesthetic 35mm film photo, soft natural grain, shallow depth of field, real place, no people, no text. Scene: " + scene, bg); }
  catch (e) { await image("Soft film photo, no people, no text: " + scene, bg); }
}

// timeline in seconds: title in, then #5 #4 #3 #2 one per beat, a longer pause, #1 lands, hold
const FPS = 30, DUR = 9.2, AT = [5.9, 4.3, 3.3, 2.3, 1.3];   // reveal time for #1..#5
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const html = `<!doctype html><meta charset="utf-8"><style>
@font-face { font-family: TT; src: url(${url(path.join(HERE, "fonts/TikTokSans.ttf"))}); font-weight: 300 900; }
* { margin: 0; box-sizing: border-box; } body { width: 1080px; height: 1920px; overflow: hidden; background: #111; font-family: TT, sans-serif; position: relative; }
#bg { position: absolute; inset: -4%; background: url(${url(bg)}) center/cover; filter: brightness(.82); }
.shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,.25), rgba(0,0,0,.05) 45%, rgba(0,0,0,.3)); }
#tl { position: absolute; left: 50px; right: 50px; top: 220px; text-align: center; font-weight: 900; font-size: 118px; line-height: 1.04; color: #fff; -webkit-text-stroke: 15px #111; paint-order: stroke fill; }
.rows { position: absolute; left: 80px; right: 80px; top: 770px; display: flex; flex-direction: column; gap: 36px; }
.row { display: flex; gap: 28px; height: 132px; }
.rn, .rs { background: #F2F2F2; color: #111; font-weight: 800; display: flex; align-items: center; box-shadow: 0 8px 20px rgba(0,0,0,.28); }
.rn { width: 132px; justify-content: center; font-size: 86px; flex: none; }
.rs { flex: 1; padding: 0 32px; font-size: 82px; text-transform: uppercase; transform-origin: left center; white-space: nowrap; overflow: hidden; }
.rs.one { background: #FFD84D; }
.brand { position: absolute; left: 0; right: 0; bottom: 250px; text-align: center; color: #fff; font-weight: 800; font-size: 52px; text-shadow: 0 3px 14px rgba(0,0,0,.7); letter-spacing: .01em; }
</style><div id="bg"></div><div class="shade"></div>
<div id="tl">${esc(S.title)}</div>
<div class="rows">${S.list.map((s, i) => `<div class="row"><span class="rn">${i + 1}.</span><span class="rs ${i === 0 ? "one" : ""}" id="r${i}">${esc(s)}</span></div>`).join("")}</div>
<div class="brand">✦ sussa</div>
<script>
const AT = ${JSON.stringify(AT)}, ease = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);
window.frame = (t) => {
  document.getElementById('bg').style.transform = 'scale(' + (1 + t * 0.006) + ')';
  const ti = ease(t / 0.45); const tl = document.getElementById('tl'); tl.style.opacity = ti; tl.style.transform = 'scale(' + (0.92 + 0.08 * ti) + ')';
  AT.forEach((a, i) => { const r = document.getElementById('r' + i), k = ease((t - a) / 0.28);
    r.style.visibility = t < a ? 'hidden' : 'visible'; r.style.transform = 'scaleX(' + k + ')' + (i === 0 ? ' scale(' + (1 + 0.06 * Math.sin(Math.min(1, (t - a) / 0.4) * Math.PI)) + ')' : ''); });
};
</script>`;
const page = path.join(OUT, "page.html"); fs.writeFileSync(page, html);
const req = createRequire(process.env.PW_REQUIRE || path.join(HERE, "../../package.json")), { chromium } = req("playwright-core");
const br = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), tab = await br.newPage({ viewport: { width: 1080, height: 1920 } });
await tab.goto(url(page)); await tab.evaluate(() => document.fonts.ready); await tab.waitForTimeout(300);
const FR = path.join(OUT, "frames"); fs.mkdirSync(FR, { recursive: true });
const N = Math.round(DUR * FPS);
for (let f = 0; f < N; f++) {
  await tab.evaluate((t) => window.frame(t), f / FPS);
  await tab.screenshot({ path: path.join(FR, String(f).padStart(4, "0") + ".jpg"), type: "jpeg", quality: 92 });
}
await br.close(); fs.rmSync(page);
// last frame doubles as the cover TikTok shows before play
fs.copyFileSync(path.join(FR, String(N - 1).padStart(4, "0") + ".jpg"), path.join(OUT, "cover.jpg"));
execFileSync(process.env.FFMPEG || "ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", path.join(FR, "%04d.jpg"), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart", path.join(OUT, "video.mp4")]);
fs.rmSync(FR, { recursive: true });
fs.writeFileSync(path.join(OUT, "meta.json"), JSON.stringify({ lang, kind: "list", date: iso, caption: S.caption, title: S.title }, null, 1));
console.log(`saved ${OUT}/video.mp4`);
