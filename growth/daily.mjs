// Daily run: one studio video per channel language (growth/studio, format by weekday from the winners list below), uploaded when
// that channel is connected. LANGS env picks the channels (default "en,tr"). A language whose evening has started gets tomorrow's
// videos, so a video is always about the day its viewers are waking up to. If a studio video fails, the old concept renderer fills in.
import { execFileSync } from "child_process"; import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
import { loadSky } from "./sky-loader.mjs";
const G = path.dirname(fileURLToPath(import.meta.url));
const sky = await loadSky();
const PLAN = JSON.parse(fs.readFileSync(path.join(G, "plan.json"), "utf8"));   // old concepts, used as the fallback
// one video a day per channel (owner, 2026-11-07, to spend credit where it works). Formats picked from 79 videos past 48 h:
// weekly median 169, yes/no 61 with spikes to 661, found and rank hit-or-miss (means 209 and 222); pick, myth, compat, signsas, pov dropped.
const DAILY = ["weekly", "yesno", "found", "rank", "yesno", "found", "rank"];   // Sunday first
const langs = (process.env.LANGS || "en,tr").split(",").map((s) => s.trim()).filter(Boolean);
const connected = (l) => !!process.env[`YT_REFRESH_${l.toUpperCase()}`] || fs.existsSync(path.join(process.env.YT_SECRETS_DIR || "D:/SussaApp/Signing", `youtube_${l}.json`));
// extra daily video for strong channels (SHORTS_EXTRA, e.g. "es"): the other of the two best formats, yes/no and rank
const extra = (process.env.SHORTS_EXTRA || "").split(",").map((s) => s.trim()).filter(Boolean);
// local publish hours per slot: a channel's videos come out hours apart instead of minutes, each with its own test window
const HOURS = [[12], [12, 19], [12, 17, 21]];
const utcAt = (d, hour, tz) => {   // that local wall-clock time in tz, as an ISO instant
  const guess = Date.UTC(d.y, d.m - 1, d.d, hour), p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: tz, hourCycle: "h23",
    year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric" }).formatToParts(new Date(guess)).map((x) => [x.type, +x.value]));
  return new Date(2 * guess - Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute)).toISOString();
};
const run = (args) => execFileSync(process.execPath, args, { stdio: "inherit" });
// uploads already made (committed by the workflow), so a second run on the same day never posts a new set
const DONE = path.join(G, "studio/done.json"), done = fs.existsSync(DONE) ? JSON.parse(fs.readFileSync(DONE, "utf8")) : [];
let failed = 0;
for (const lang of langs) {
  const tz = sky.HORO_UI[lang].tz;
  const hour = +new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "2-digit", hourCycle: "h23" }).format(new Date());
  const d = hour >= 18 ? sky.addDays(sky.ymdIn(tz), 1) : sky.ymdIn(tz);
  const iso = `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  const formats = [DAILY[new Date(Date.UTC(d.y, d.m - 1, d.d)).getUTCDay()]];
  if (extra.includes(lang)) formats.push(!formats.includes("yesno") ? "yesno" : !formats.includes("rank") ? "rank" : "pick");
  const out = path.join(G, "out", iso);
  formats.forEach((fmt, slot) => {
    let mp4 = path.join(out, `${lang}_s${fmt}.mp4`); const key = `${iso}/${lang}/${slot}`;
    if (done.includes(key)) { console.log("already posted", key); return; }
    try {
      if (!fs.existsSync(mp4)) run([path.join(G, "studio/build.mjs"), lang, fmt, iso, out]);
    } catch (e) {
      console.error(`studio ${lang} ${fmt} failed (${e.message}), using the old renderer`);
      const kind = PLAN.after[slot % PLAN.after.length]; mp4 = path.join(out, `${lang}_${kind}.mp4`);
      try { if (!fs.existsSync(mp4)) run([path.join(G, "render.mjs"), lang, kind, iso]); } catch (e2) { failed++; console.error(`FAILED ${lang} ${kind}: ${e2.message}`); return; }
    }
    try {
      const mf = mp4.replace(/\.mp4$/, ".json"), meta = JSON.parse(fs.readFileSync(mf, "utf8"));
      meta.publishAt = utcAt(d, HOURS[formats.length - 1][slot], tz); fs.writeFileSync(mf, JSON.stringify(meta, null, 1));
      if (connected(lang)) { run([path.join(G, "youtube.mjs"), "upload", mp4]); done.push(key); fs.writeFileSync(DONE, JSON.stringify(done.slice(-400))); }
      else console.log(`no YouTube channel connected for ${lang}, video kept at ${mp4}`);
    } catch (e) { failed++; console.error(`UPLOAD FAILED ${lang} ${fmt}: ${e.message}`); }
  });
}
process.exit(failed ? 1 : 0);
