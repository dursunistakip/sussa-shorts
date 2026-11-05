// TikTok character video: Sussa's AI-generated presenter reads out the real daily card one sign got in the app today, in one continuous take.
//   node growth/tiktok/ugc.mjs <lang> <YYYY-MM-DD> [outDir]
// The card and the message are the app's own for that sign and date, so "every Scorpio got this today" is true. She presents, she never
// claims to be a customer. The owner turns on TikTok's AI-generated label when posting.
// script (Gemini) -> first clip from the character photo + Veo continuations (one take, Veo's own voice) -> word timings -> captions, real card, end card.
import fs from "fs"; import path from "path"; import { createRequire } from "module"; import { execFileSync } from "child_process"; import { fileURLToPath } from "url";
import { gemini, image, veo } from "../studio/vertex.mjs"; import { CARD_NAMES } from "../studio/formats.mjs"; import { loadSky } from "../sky-loader.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url)), [lang, iso, outArg] = process.argv.slice(2), FF = process.env.FFMPEG || "ffmpeg", PY = process.env.PYTHON || "python";
const OUT = path.join(outArg || path.join(HERE, "../out", iso), `${lang}_ugc`); fs.mkdirSync(OUT, { recursive: true });
const url = (p) => "file:///" + path.resolve(p).replace(/\\/g, "/"), ff = (a) => execFileSync(FF, ["-y", "-loglevel", "error", ...a], { stdio: "inherit" });
const LANG = { en: "American English", tr: "Turkish from Istanbul", pt: "Brazilian Portuguese", es: "Mexican Spanish", id: "casual Indonesian from Jakarta", vi: "Vietnamese from Saigon" }[lang], W = 1080, H = 1920, END = 2.6;

// today's real content: a different sign every day
const sky = await loadSky(), [y, m, d] = iso.split("-").map(Number), date = { y, m, d }, sign = Math.floor(Date.parse(iso) / 864e5) % 12;
const signName = sky.t(lang, `sign.${sky.SIGNS[sign]}.name`), { card, reversed } = sky.dailyCard(sign, date), today = sky.daily(lang, sign, date);
const cardName = `${CARD_NAMES[card]}${reversed ? " reversed" : ""}`;
const TXT = { en: ["today", "your sign's card, every morning", "free on Google Play"], tr: ["bugün", "burcunun kartı, her sabah", "Google Play'de ücretsiz"], pt: ["hoje", "a carta do seu signo, toda manhã", "grátis no Google Play"],
  es: ["hoy", "la carta de tu signo, cada mañana", "gratis en Google Play"], id: ["hari ini", "kartu zodiakmu, tiap pagi", "gratis di Google Play"], vi: ["hôm nay", "lá bài của cung bạn, mỗi sáng", "miễn phí trên Google Play"] }[lang];

const ref = path.join(HERE, "chars", "mara.jpg");
const scriptFile = path.join(OUT, "script.json");
const S = fs.existsSync(scriptFile) ? JSON.parse(fs.readFileSync(scriptFile, "utf8")) : await gemini(`Write a 3-part talking-to-camera TikTok in ${LANG}. The speaker is the presenter of Sussa, a free tarot and daily horoscope app. She talks like a funny, slightly tired friend.
True facts: everyone with the sign ${signName} sees the same daily card in Sussa today: ${cardName}. The app's message for them today: "${today.open}" Love: "${today.love}" Advice: "${today.flavor}"
Part 1 (hook): says that every ${signName} on Sussa got the same card this morning, names the card, and teases it in a way that makes people of every sign stay. Part 2: what it means for them today, built on the card's real meaning and the app's message, one relatable and specific line about daily life. Part 3: a funny closing line, then tells people to check their own sign's card on Sussa, free on Google Play.
Rules: each part is one spoken breath of 15-18 words, easy to say in 6.5 seconds, real speech ("okay so", "like"). She presents the app; she must not say she uses it, and must not claim results. No promises about health, money or what a real person will do. Spell the name "Sussa".
Return JSON: {"lines":[{"say":"...","face":"her expression in English"}] (exactly 3), "cardWord":"the exact word in part 1, as written there, that finishes the card's name", "caption":"short natural caption + 3 hashtags"}`);
fs.writeFileSync(scriptFile, JSON.stringify(S, null, 1));

// one take: the first clip, then each continuation carries the whole take so far
const LOOK = "Handheld front-camera phone selfie video, slight natural shake, parked car at dusk, faint car interior ambience, flat real phone audio. She looks into the lens and speaks casually at an easy steady pace, in the same voice throughout. She speaks ${LANG} as her mother tongue, with the everyday melody and rhythm of a voice note to a friend, never like an announcer. She talks without long pauses right up to the end of the clip. Her hands stay empty, no objects, no cards. No music, no subtitles, no captions, no on-screen text.";
const NEG = "seatbelt, seat belt, strap, band across chest, subtitles, captions, on-screen text, letters, words";
const take = S.lines.map((_, i) => path.join(OUT, `take_${i}.mp4`));
for (let i = 0; i < S.lines.length; i++) {
  if (fs.existsSync(take[i])) continue;
  const l = S.lines[i], line = `${l.face}. She says: "${l.say}"`;
  if (i === 0) await veo(`${LOOK} ${line}`, take[0], { image: ref, audio: true, resolution: "720p", negative: NEG });
  else await veo(`${LOOK} Her clothes and the car stay exactly as they are, nothing is added across her chest, her hoodie stays completely uncovered. She carries on without a pause in the same voice. ${line}`, take[i], { video: take[i - 1], audio: true, seconds: 7, resolution: "720p", negative: NEG });
}
const full = take.at(-1);

// word timings for captions and for the moment the card is named
const wav = path.join(OUT, "voice.wav"), words = S.lines.flatMap((l) => l.say.trim().split(/\s+/)), al = path.join(OUT, "al.json");
if (!fs.existsSync(al)) {
  ff(["-i", full, "-ar", "24000", "-ac", "1", "-c:a", "pcm_s16le", wav]);
  fs.writeFileSync(path.join(OUT, "jobs.json"), JSON.stringify([{ wav, words, out: al, lang }]));
  execFileSync(PY, [path.join(HERE, "../studio/align.py"), path.join(OUT, "jobs.json"), ...(process.env.WHISPER_DIR ? [process.env.WHISPER_DIR] : [])], { stdio: "inherit" });
}
const { times, total } = JSON.parse(fs.readFileSync(al, "utf8"));
const norm = (s) => s.toLowerCase().replace(/[^\p{L}]/gu, ""), key = norm(S.cardWord || CARD_NAMES[card].split(" ").at(-1)), at = words.findIndex((w) => norm(w) === key);
const cardAt = at >= 0 ? times[at][0] : 3, voiceEnd = Math.min(total, times.at(-1)[1] + 0.35);

// overlays rendered as PNG: the real card with the sign, and the end card with the app's own screen
const req = createRequire(process.env.PW_REQUIRE || path.join(HERE, "../../package.json")), { chromium } = req("playwright-core");
const br = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), tab = await br.newPage({ viewport: { width: W, height: H } });
const CSS = `@font-face { font-family: TT; src: url(${url(path.join(HERE, "fonts/TikTokSans.ttf"))}); font-weight: 300 900; } * { margin: 0; box-sizing: border-box; } body { width: ${W}px; height: ${H}px; font-family: TT, sans-serif; position: relative; overflow: hidden; }`;
const cardImg = path.join(OUT, "ov_card.png"), endImg = path.join(OUT, "ov_end.png"), cardFile = path.join(HERE, "../studio/assets/cards", String(card).padStart(2, "0") + ".jpg");
const render = async (html, file, transparent) => { const f = file + ".html"; fs.writeFileSync(f, `<!doctype html><meta charset="utf-8"><style>${CSS}</style>${html}`); await tab.goto(url(f)); await tab.waitForTimeout(300); await tab.screenshot({ path: file, omitBackground: transparent }); fs.rmSync(f); };
await render(`<div style="position:absolute;right:36px;top:170px;width:330px;text-align:center"><img src="${url(cardFile)}" style="width:100%;border-radius:18px;box-shadow:0 14px 40px rgba(0,0,0,.6);transform:rotate(${reversed ? 178 : 3}deg)">
  <div style="margin-top:16px;display:inline-block;background:#fff;color:#111;font-weight:700;font-size:32px;padding:8px 16px;border-radius:12px">sussa · ${signName.toLocaleLowerCase(lang)} ${TXT[0]}</div></div>`, cardImg, true);
const shot = path.join(HERE, "../studio/assets/shots", `${lang}_1.jpg`);
await render(`<div style="position:absolute;inset:0;background:radial-gradient(ellipse at 50% 30%,#3a1f6e,#120826);color:#fff;text-align:center">
  <img src="${url(path.join(HERE, "../studio/assets/icon.png"))}" style="width:170px;border-radius:38px;margin-top:150px">
  <div style="font-weight:800;font-size:92px;margin-top:20px">Sussa</div><div style="font-weight:500;font-size:44px;margin-top:6px;color:#F6C766">${TXT[1]}</div>
  <img src="${url(shot)}" style="width:560px;height:930px;object-fit:cover;object-position:top;border-radius:40px;margin-top:44px;box-shadow:0 20px 60px rgba(0,0,0,.6)">
  <div style="font-weight:700;font-size:48px;margin-top:40px">${TXT[2]}</div></div>`, endImg, false);
await br.close();

// captions: 3-4 words at a time on the real word timings
const font = path.join(HERE, "fonts/TikTokSans.ttf").replace(/\\/g, "/").replace(":", "\\:");
const esc = (t) => t.replace(/\\/g, "").replace(/'/g, "\u2019").replace(/:/g, "\\:").replace(/,/g, "\\,").replace(/%/g, "\\%");
const caps = []; for (let k = 0; k < words.length; k += 4) { const e = Math.min(words.length, k + 4) - 1;
  caps.push(`drawtext=fontfile='${font}':text='${esc(words.slice(k, e + 1).join(" "))}':fontsize=60:fontcolor=black:box=1:boxcolor=white:boxborderw=16:x=(w-text_w)/2:y=h*0.70:enable='between(t,${times[k][0].toFixed(2)},${(words[e + 1] ? times[e + 1][0] : voiceEnd).toFixed(2)})'`); }
const out = path.join(OUT, "video.mp4");
const graph = `[0:v]trim=0:${voiceEnd},setpts=PTS-STARTPTS,scale=${W}:${H}:flags=lanczos,fps=30,format=yuv420p,setsar=1[b];[1:v]format=rgba[c];[b][c]overlay=0:0:enable='gte(t,${cardAt.toFixed(2)})',${caps.join(",")}[v0];` +
  `[2:v]scale=${W}:${H},fps=30,format=yuv420p,setsar=1,trim=0:${END},setpts=PTS-STARTPTS[e];[0:a]atrim=0:${voiceEnd},asetpts=PTS-STARTPTS,aresample=48000,aformat=channel_layouts=stereo,afade=t=out:st=${(voiceEnd - 0.15).toFixed(2)}:d=0.15[a0];aevalsrc=0:d=${END}:s=48000:c=stereo[a1];[v0][a0][e][a1]concat=n=2:v=1:a=1[v][a]`;
ff(["-i", full, "-i", cardImg, "-loop", "1", "-i", endImg, "-filter_complex", graph, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", out]);
fs.writeFileSync(path.join(OUT, "meta.json"), JSON.stringify({ lang, kind: "ugc", date: iso, caption: S.caption, ai: true, sign: sky.SIGNS[sign], card: cardName }, null, 1));
console.log(`saved ${out} (${(voiceEnd + END).toFixed(1)} s, ${signName}, ${cardName})`);
