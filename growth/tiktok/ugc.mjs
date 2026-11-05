// TikTok talking-character video: an AI-generated fictional character tells a short tarot story to her phone camera.
//   node growth/tiktok/ugc.mjs <lang> <YYYY-MM-DD> [outDir]
// She never says she uses an app and never reviews anything. The owner turns on TikTok's AI-generated label when posting.
// script (Gemini) -> one Veo clip per line from the character's reference photo (Veo's own voice) -> concat + captions.
import fs from "fs"; import path from "path"; import { execFileSync } from "child_process"; import { fileURLToPath } from "url";
import { gemini, image, veo } from "../studio/vertex.mjs"; import { BANK } from "../studio/formats.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url)), [lang, iso, outArg] = process.argv.slice(2), FF = process.env.FFMPEG || "ffmpeg";
const OUT = path.join(outArg || path.join(HERE, "../out", iso), `${lang}_ugc`); fs.mkdirSync(OUT, { recursive: true });
const LANG = { en: "American English" }[lang] || lang;
const CLIPS = 3, day = Math.floor(Date.parse(iso) / 864e5);
const topic = BANK.pov[day % BANK.pov.length];

// the same fictional adult character every time, so the account feels like one person's series
const CHAR = "a 27-year-old woman with shoulder-length dark brown hair, light freckles, an oversized grey hoodie, no makeup";
const ref = path.join(HERE, "chars", "mara.jpg");
if (!fs.existsSync(ref)) { fs.mkdirSync(path.dirname(ref), { recursive: true });
  await image(`Candid front-camera selfie photo of ${CHAR}, sitting in a parked car at dusk, phone held at arm's length, looking straight into the lens, ordinary skin texture, slightly grainy amateur phone photo, not a model, no text.`, ref); }

const scriptFile = path.join(OUT, "script.json");
const S = fs.existsSync(scriptFile) ? JSON.parse(fs.readFileSync(scriptFile, "utf8")) : await gemini(`Write a ${CLIPS}-part talking-to-camera TikTok in ${LANG}, topic: "${topic}".
A tired, funny 27-year-old woman tells a friend-style story about tarot in her own life. It is fiction.
Rules: part 1 opens mid-story with something oddly specific that makes you stay. Each part is one spoken breath of 14-18 words, easy to say in 7 seconds, real speech with small hesitations ("okay so", "like"). The ending lands a small twist or a line worth sending to a friend.
Never mention an app, a website, a product or a brand. No promises about health, money or what a real person will do.
Return JSON: {"lines":[{"say":"...","face":"her expression and small gesture in English"}] (exactly ${CLIPS}), "caption":"short natural caption + 3 hashtags"}`);
fs.writeFileSync(scriptFile, JSON.stringify(S, null, 1));

const LOOK = "Handheld front-camera phone selfie video, slight natural shake, parked car at dusk, flat real phone audio with faint car interior ambience. She looks into the lens and speaks casually in a natural voice. Her hands stay empty: she holds no cards and no objects, no cards appear anywhere. No music, no subtitles, no captions, no on-screen text.";
const clips = S.lines.map((_, i) => path.join(OUT, `clip_${i}.mp4`));
await Promise.all(S.lines.map((l, i) => (fs.existsSync(clips[i]) ? null : veo(`${LOOK} ${l.face}. She says: "${l.say}"`, clips[i], { image: ref, audio: true }))));

// captions: short chunks timed across each 8 s clip, in the same white-box style as the slideshows
const font = path.join(HERE, "fonts/TikTokSans.ttf").replace(/\\/g, "/").replace(":", "\\:");
const esc = (t) => t.replace(/\\/g, "").replace(/'/g, "\u2019").replace(/:/g, "\\:").replace(/,/g, "\\,").replace(/%/g, "\\%");
const parts = [];
S.lines.forEach((l, i) => {
  const w = l.say.trim().split(/\s+/), chunks = []; for (let k = 0; k < w.length; k += 4) chunks.push(w.slice(k, k + 4).join(" "));
  const a = 0.3, b = 7.5, step = (b - a) / chunks.length;
  chunks.forEach((c, k) => { const t0 = (a + k * step).toFixed(2), t1 = (a + (k + 1) * step).toFixed(2);
    parts.push(`[v${i}]drawtext=fontfile='${font}':text='${esc(c)}':fontsize=58:fontcolor=black:box=1:boxcolor=white:boxborderw=16:x=(w-text_w)/2:y=h*0.68:enable='between(t,${t0},${t1})'[v${i}]`.replace(`[v${i}]drawtext`, `[v${i}${k ? `_${k - 1}` : ""}]drawtext`).replace(/\[v\d+\]$/, `[v${i}_${k}]`)); });
  parts.push(`[v${i}_${chunks.length - 1}]null[o${i}]`);
});
const pre = S.lines.map((_, i) => `[${i}:v]scale=1080:1920,setsar=1,fps=30[v${i}]`), cc = S.lines.map((_, i) => `[o${i}][${i}:a]`).join("");
const out = path.join(OUT, "video.mp4"), graph = [...pre, ...parts, `${cc}concat=n=${S.lines.length}:v=1:a=1[v][a]`].join(";");
execFileSync(FF, ["-y", "-loglevel", "error", ...clips.flatMap((c) => ["-i", c]), "-filter_complex", graph, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-crf", "21", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", out], { stdio: "inherit" });
fs.writeFileSync(path.join(OUT, "meta.json"), JSON.stringify({ lang, kind: "ugc", date: iso, caption: S.caption, ai: true }, null, 1));
console.log(`saved ${out}`);
