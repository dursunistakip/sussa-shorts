// Daily TikTok hand-off sent to the owner's Telegram: slideshows (TIKTOK_SLIDES per day), optional countdown list video (TIKTOK_LIST) and character video (TIKTOK_UGC).
//   node growth/tiktok/daily.mjs [YYYY-MM-DD]     env TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, TIKTOK_LANGS (default "en")
import fs from "fs"; import path from "path"; import { execFileSync } from "child_process"; import { fileURLToPath } from "url";

const HERE = path.dirname(fileURLToPath(import.meta.url)), iso = process.argv[2] || new Date().toISOString().slice(0, 10);
const TOKEN = process.env.TELEGRAM_BOT_TOKEN, CHAT = process.env.TELEGRAM_CHAT_ID, api = (m) => `https://api.telegram.org/bot${TOKEN}/${m}`;
const langs = (process.env.TIKTOK_LANGS || "en").split(",").map((s) => s.trim()).filter(Boolean), out = path.join(HERE, "../out", iso);
const DONE = path.join(HERE, "done.json"), done = fs.existsSync(DONE) ? JSON.parse(fs.readFileSync(DONE, "utf8")) : [];
const day = Math.floor(Date.parse(iso) / 864e5), PAIRS = [["pick", "rank"], ["found", "pick"], ["rank", "found"]];
const run = (a) => execFileSync(process.execPath, a, { stdio: "inherit" });

async function note(text, reply) {
  const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  await fetch(api("sendMessage"), { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ chat_id: CHAT, parse_mode: "HTML", reply_to_message_id: reply, text: `<code>${esc(text)}</code>` }) });
}
async function sendSlides(dir, meta) {
  const pngs = fs.readdirSync(dir).filter((f) => /^\d+\.png$/.test(f)).sort().slice(0, 10), form = new FormData();
  form.append("chat_id", CHAT);
  form.append("media", JSON.stringify(pngs.map((f, i) => ({ type: "photo", media: `attach://p${i}`, ...(i ? {} : { caption: `${meta.lang.toUpperCase()} · ${meta.kind} · TikTok foto modu, sesi telefondan ekle` }) }))));
  pngs.forEach((f, i) => form.append(`p${i}`, new Blob([fs.readFileSync(path.join(dir, f))], { type: "image/png" }), f));
  const r = await (await fetch(api("sendMediaGroup"), { method: "POST", body: form })).json();
  if (!r.ok) throw new Error(r.description);
  await note(meta.caption, r.result[0].message_id);
}
async function sendVideo(dir, meta, label = `karakter videosu · TikTok'ta "AI-generated" etiketini aç`) {
  const form = new FormData();
  form.append("chat_id", CHAT); form.append("caption", `${meta.lang.toUpperCase()} · ${label}`); form.append("supports_streaming", "true");
  form.append("width", "1080"); form.append("height", "1920");
  form.append("video", new Blob([fs.readFileSync(path.join(dir, "video.mp4"))], { type: "video/mp4" }), `sussa_${meta.kind || "video"}.mp4`);
  const r = await (await fetch(api("sendVideo"), { method: "POST", body: form })).json();
  if (!r.ok) throw new Error(r.description);
  await note(meta.caption, r.result.message_id);
}

for (const lang of langs) {
  const key = `${iso}/${lang}`; if (done.includes(key)) { console.log("already sent", key); continue; }
  // TIKTOK_SLIDES limits the slideshows per day (2026-11-12: one a day, formats rotate)
  const nSlides = Math.max(1, Math.min(2, +(process.env.TIKTOK_SLIDES || 2)));
  const fmts = nSlides === 1 ? [["pick", "rank", "found"][day % 3]] : PAIRS[day % PAIRS.length];
  for (const fmt of fmts) {
    try {
      run([path.join(HERE, "slides.mjs"), lang, fmt, iso, out]);
      const dir = path.join(out, `${lang}_slides_${fmt}`); await sendSlides(dir, JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8")));
    } catch (e) { console.error(`slides ${lang} ${fmt} failed: ${e.message}`); }
  }
  // countdown list video (top 5 signs, #1 lands last), daily test from 2026-11-09; TIKTOK_LIST=off stops it
  if (process.env.TIKTOK_LIST !== "off") {
    try {
      run([path.join(HERE, "listvideo.mjs"), lang, iso, out]);
      const dir = path.join(out, `${lang}_list`); await sendVideo(dir, JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8")), "liste videosu · trend bir sesi telefondan ekle");
    } catch (e) { console.error(`list ${lang} failed: ${e.message}`); }
  }
  if (process.env.TIKTOK_UGC === "on" && day % 2 === 0) {   // paused 2026-11-05 until the first results are in
    try {
      run([path.join(HERE, "ugc.mjs"), lang, iso, out]);
      const dir = path.join(out, `${lang}_ugc`); await sendVideo(dir, JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8")));
    } catch (e) { console.error(`ugc ${lang} failed: ${e.message}`); }
  }
  done.push(key); fs.writeFileSync(DONE, JSON.stringify(done.slice(-200)));
}
