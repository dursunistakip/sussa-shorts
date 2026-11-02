// Sends the day's rendered videos to the owner's Telegram (TikTok has no allowed way to auto-post to your own account):
// video + a ready-to-paste caption, so posting on TikTok is: save, open TikTok, paste, post.
//   node growth/telegram.mjs <dir with <lang>_<kind>.mp4 + .json>     env TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TIKTOK_LANGS (default "en")
import fs from "fs"; import path from "path"; import os from "os"; import { execFileSync } from "child_process";
const TOKEN = process.env.TELEGRAM_BOT_TOKEN, CHAT = process.env.TELEGRAM_CHAT_ID;
const LANGS = (process.env.TIKTOK_LANGS || "en").split(",").map((s) => s.trim()).filter(Boolean);
const dir = process.argv[2], FF = process.env.FFMPEG || "ffmpeg";
if (!TOKEN || !CHAT) { console.log("telegram: no bot configured, skipped"); process.exit(0); }

// TikTok captions: short hook + 3-5 hashtags; no links (not clickable there), the profile link carries the app
const TAGS = { en: "#tarot #astrology #zodiac #horoscope #fyp", tr: "#tarot #burçlar #astroloji #keşfet", pt: "#tarot #signos #astrologia #fyp", es: "#tarot #signos #astrologia #parati",
  id: "#tarot #zodiak #ramalan #fyp", vi: "#tarot #cunghoangdao #tuvi #xuhuong" };
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".mp4") && !f.endsWith(".tiktok.mp4") && LANGS.includes(f.split("_")[0])).sort() : [];
let sent = 0;
for (const f of files) {
  const meta = JSON.parse(fs.readFileSync(path.join(dir, f.replace(/\.mp4$/, ".json")), "utf8"));
  const caption = meta.tiktok || `${meta.title.replace(/\s*#\S+/g, "").trim()}\n\n${TAGS[meta.lang] || TAGS.en}`;
  // TikTok copy keeps our music (owner: added sounds often don't fit). Studio videos ship a smaller .tiktok.mp4 for the 50 MB bot limit.
  const own = path.join(dir, f.replace(/\.mp4$/, ".tiktok.mp4")), quiet = path.join(os.tmpdir(), `tiktok_${f}`);
  fs.copyFileSync(fs.existsSync(own) ? own : path.join(dir, f), quiet);
  // without width/height/thumbnail Telegram clients draw the video square; a 9:16 thumb fixes the preview
  const thumb = quiet.replace(/\.mp4$/, ".jpg"), probe = (() => { try { execFileSync(FF, ["-i", quiet], { stdio: "pipe" }); } catch (e) { return String(e.stderr); } return ""; })();
  const dur = (/Duration: (\d+):(\d+):([\d.]+)/.exec(probe) || []).slice(1).map(Number), seconds = dur.length ? Math.round(dur[0] * 3600 + dur[1] * 60 + dur[2]) : 0;
  // long formats (weekly, 80-90 s) pass the 50 MB bot limit: re-encode to fit ~45 MB
  if (fs.statSync(quiet).size > 48e6 && seconds) {
    const kbps = Math.floor((45e6 * 8) / seconds / 1000) - 160, small = quiet.replace(/\.mp4$/, "_s.mp4");
    execFileSync(FF, ["-y", "-loglevel", "error", "-i", quiet, "-c:v", "libx264", "-preset", "medium", "-b:v", `${kbps}k`, "-maxrate", `${kbps}k`, "-bufsize", `${kbps * 2}k`, "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", small]);
    fs.renameSync(small, quiet);
  }
  execFileSync(FF, ["-y", "-loglevel", "error", "-ss", "1", "-i", quiet, "-frames:v", "1", "-vf", "scale=180:320", "-q:v", "4", thumb]);
  const form = new FormData();
  form.append("chat_id", CHAT); form.append("caption", `${meta.lang.toUpperCase()} · ${meta.kind} · TikTok`); form.append("supports_streaming", "true");
  form.append("width", "1080"); form.append("height", "1920"); if (seconds) form.append("duration", String(seconds));
  form.append("thumbnail", new Blob([fs.readFileSync(thumb)], { type: "image/jpeg" }), "thumb.jpg"); fs.rmSync(thumb, { force: true });
  form.append("video", new Blob([fs.readFileSync(quiet)], { type: "video/mp4" }), `sussa_${meta.lang}_${meta.kind}.mp4`);
  const r = await (await fetch(`https://api.telegram.org/bot${TOKEN}/sendVideo`, { method: "POST", body: form })).json();
  fs.rmSync(quiet, { force: true });
  if (!r.ok) { console.error(`telegram ${f}: ${r.description}`); continue; }
  // caption as its own message in a code block: one tap copies it in Telegram
  const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const t = await (await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, { method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: CHAT, parse_mode: "HTML", reply_to_message_id: r.result.message_id, text: `<code>${esc(caption)}</code>` }) })).json();
  if (t.ok) sent++; else console.error(`telegram caption ${f}: ${t.description}`);
}
console.log(`telegram: sent ${sent}/${files.length}`);
