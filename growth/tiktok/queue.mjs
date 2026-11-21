// Sends today's pre-rendered TikTok posts (growth/tiktok/queue/<YYYY-MM-DD>_<n>/) to the owner's Telegram.
// No generation and no paid API: posts are written and rendered ahead of time (v3/render.mjs, week specs in v3/weekN).
// env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, optional QUEUE_DATE=YYYY-MM-DD
import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
const HERE = path.dirname(fileURLToPath(import.meta.url));
const Q = path.join(HERE, "queue");
const token = process.env.TELEGRAM_BOT_TOKEN, chat = process.env.TELEGRAM_CHAT_ID;
if (!token || !chat) throw new Error("TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID missing");
const api = (m) => `https://api.telegram.org/bot${token}/${m}`;
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
const day = process.env.QUEUE_DATE || new Date().toISOString().slice(0, 10);
const sentFile = path.join(Q, "sent.json");
const sent = fs.existsSync(sentFile) ? JSON.parse(fs.readFileSync(sentFile, "utf8")) : {};

async function call(method, init, tries = 4) {
  for (let i = 0; ; i++) {
    const r = await (await fetch(api(method), init)).json();
    if (r.ok) return r;
    if (i >= tries || !(r.parameters?.retry_after || r.error_code >= 500)) throw new Error(`${method}: ${r.description}`);
    await new Promise((res) => setTimeout(res, 1000 * (r.parameters?.retry_after || 5)));
  }
}
const msg = (text) => call("sendMessage", { method: "POST", headers: { "content-type": "application/json" },
  body: JSON.stringify({ chat_id: chat, text, parse_mode: "HTML" }) });
async function album(dir) {
  const files = fs.readdirSync(dir).filter((f) => /^\d+\.(jpg|png)$/.test(f)).sort();
  const fd = new FormData(); fd.append("chat_id", chat);
  fd.append("media", JSON.stringify(files.map((f, i) => ({ type: "photo", media: `attach://p${i}` }))));
  files.forEach((f, i) => fd.append(`p${i}`, new Blob([fs.readFileSync(path.join(dir, f))], { type: f.endsWith(".png") ? "image/png" : "image/jpeg" }), f));
  await call("sendMediaGroup", { method: "POST", body: fd });
  return files.length;
}

const todays = fs.existsSync(Q) ? fs.readdirSync(Q).filter((d) => d.startsWith(day + "_")).sort() : [];
if (!todays.length) {
  const left = fs.existsSync(Q) ? fs.readdirSync(Q).filter((d) => /^\d{4}-\d\d-\d\d_\d+$/.test(d) && d.slice(0, 10) > day).length : 0;
  if (!left && !sent[`empty_${day}`]) { await msg("TikTok kuyruğu bitti: yeni haftanın gönderileri hazırlanmalı."); sent[`empty_${day}`] = true; }
  console.log("nothing queued for", day);
} else {
  for (const [i, d] of todays.entries()) {
    if (sent[d]) { console.log("already sent", d); continue; }
    const dir = path.join(Q, d);
    const label = fs.existsSync(path.join(dir, "label.txt")) ? fs.readFileSync(path.join(dir, "label.txt"), "utf8").trim() : d;
    await msg(`<b>${esc(day)} · Gönderi ${i + 1}</b>\n${esc(label)}`);
    const n = await album(dir);
    await msg(`<code>${esc(fs.readFileSync(path.join(dir, "caption.txt"), "utf8").trim())}</code>`);
    sent[d] = new Date().toISOString(); console.log("sent", d, n, "slides");
  }
}
fs.writeFileSync(sentFile, JSON.stringify(sent, null, 1));
