// Daily TikTok hand-off: two slideshows every day and a talking-character video every second day, sent to the owner's Telegram.
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
async function sendVideo(dir, meta) {
  const form = new FormData();
  form.append("chat_id", CHAT); form.append("caption", `${meta.lang.toUpperCase()} · karakter videosu · TikTok'ta "AI-generated" etiketini aç`); form.append("supports_streaming", "true");
  form.append("width", "1080"); form.append("height", "1920");
  form.append("video", new Blob([fs.readFileSync(path.join(dir, "video.mp4"))], { type: "video/mp4" }), "sussa_ugc.mp4");
  const r = await (await fetch(api("sendVideo"), { method: "POST", body: form })).json();
  if (!r.ok) throw new Error(r.description);
  await note(meta.caption, r.result.message_id);
}

for (const lang of langs) {
  const key = `${iso}/${lang}`; if (done.includes(key)) { console.log("already sent", key); continue; }
  for (const fmt of PAIRS[day % PAIRS.length]) {
    try {
      run([path.join(HERE, "slides.mjs"), lang, fmt, iso, out]);
      const dir = path.join(out, `${lang}_slides_${fmt}`); await sendSlides(dir, JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8")));
    } catch (e) { console.error(`slides ${lang} ${fmt} failed: ${e.message}`); }
  }
  if (day % 2 === 0) {
    try {
      run([path.join(HERE, "ugc.mjs"), lang, iso, out]);
      const dir = path.join(out, `${lang}_ugc`); await sendVideo(dir, JSON.parse(fs.readFileSync(path.join(dir, "meta.json"), "utf8")));
    } catch (e) { console.error(`ugc ${lang} failed: ${e.message}`); }
  }
  done.push(key); fs.writeFileSync(DONE, JSON.stringify(done.slice(-200)));
}
