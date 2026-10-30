// Daily snapshot of every Short on the connected channels -> growth/stats/youtube.csv (committed by the workflow), so the format
// test can compare videos at the same age (views after 24 h, 48 h, 7 days). The concept comes from the utm_campaign in the description.
//   node growth/stats.mjs            (YT_CLIENT_ID/SECRET + YT_REFRESH_<LANG>, or the local files youtube.mjs uses)
//   node growth/stats.mjs report     per-concept summary at 48 h and latest
import fs from "fs"; import path from "path"; import { fileURLToPath } from "url";
const G = path.dirname(fileURLToPath(import.meta.url)), OUT = path.join(G, "stats", "youtube.csv");
const SECRETS = process.env.YT_SECRETS_DIR || "D:/SussaApp/Signing";
const LANGS = ["en", "tr", "pt", "es", "id", "vi"];

if (process.argv[2] === "report") report(); else await snapshot();

async function snapshot() {
  const client = process.env.YT_CLIENT_ID ? { id: process.env.YT_CLIENT_ID, secret: process.env.YT_CLIENT_SECRET }
    : (() => { const c = JSON.parse(fs.readFileSync(path.join(SECRETS, "youtube_client.json"), "utf8")).installed; return { id: c.client_id, secret: c.client_secret }; })();
  const refresh = (l) => process.env[`YT_REFRESH_${l.toUpperCase()}`] || (fs.existsSync(path.join(SECRETS, `youtube_${l}.json`)) ? JSON.parse(fs.readFileSync(path.join(SECRETS, `youtube_${l}.json`), "utf8")).refresh_token : null);
  const now = new Date(), rows = [];
  for (const lang of LANGS) {
    const rt = refresh(lang); if (!rt) continue;
    const tok = await (await fetch("https://oauth2.googleapis.com/token", { method: "POST", body: new URLSearchParams({ client_id: client.id, client_secret: client.secret, refresh_token: rt, grant_type: "refresh_token" }) })).json();
    const api = (u) => fetch(`https://www.googleapis.com/youtube/v3/${u}`, { headers: { Authorization: `Bearer ${tok.access_token}` } }).then((r) => r.json());
    const up = (await api("channels?part=contentDetails&mine=true")).items[0].contentDetails.relatedPlaylists.uploads;
    const ids = ((await api(`playlistItems?part=contentDetails&maxResults=50&playlistId=${up}`)).items || []).map((x) => x.contentDetails.videoId);
    if (!ids.length) continue;
    for (const v of (await api(`videos?part=snippet,statistics,status&id=${ids.join(",")}`)).items || []) {
      const m = /utm_campaign%3D([a-z0-9]+)_([a-z]{2})|utm_campaign=([a-z0-9]+)_([a-z]{2})/.exec(v.snippet.description || "");
      if (!m || v.status.privacyStatus !== "public") continue;   // only the automated Sussa videos
      const s = v.statistics, age = (now - new Date(v.snippet.publishedAt)) / 3600000;
      rows.push([now.toISOString().slice(0, 16), lang, v.id, m[1] || m[3], v.snippet.publishedAt.slice(0, 16), age.toFixed(1), s.viewCount || 0, s.likeCount || 0, s.commentCount || 0]);
    }
  }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  if (!fs.existsSync(OUT)) fs.writeFileSync(OUT, "snapshot,lang,video,concept,published,age_h,views,likes,comments\n");
  fs.appendFileSync(OUT, rows.map((r) => r.join(",")).join("\n") + (rows.length ? "\n" : ""));
  console.log(`stats: ${rows.length} videos`);
}

function report() {
  const [head, ...lines] = fs.readFileSync(OUT, "utf8").trim().split("\n"), keys = head.split(",");
  const recs = lines.map((l) => Object.fromEntries(l.split(",").map((v, i) => [keys[i], v])));
  const by = {};
  for (const r of recs) { const k = `${r.lang} ${r.concept.replace(/\d+$/, "")}`, v = (by[k] ||= {}), x = (v[r.video] ||= { at48: null, last: null });
    const age = +r.age_h, views = +r.views;
    if (age <= 60 && (!x.at48 || Math.abs(age - 48) < Math.abs(x.at48.age - 48))) x.at48 = { age, views };
    if (!x.last || age > x.last.age) x.last = { age, views, likes: +r.likes, comments: +r.comments }; }
  const out = Object.entries(by).map(([k, vids]) => { const v = Object.values(vids), n = v.length, sum = (f) => v.reduce((s, x) => s + f(x), 0);
    return { k, n, views48: Math.round(sum((x) => x.at48?.views || 0) / n), views: Math.round(sum((x) => x.last.views) / n), likeRate: (100 * sum((x) => x.last.likes) / Math.max(1, sum((x) => x.last.views))).toFixed(1), comments: sum((x) => x.last.comments) }; })
    .sort((a, b) => b.views48 - a.views48);
  console.log("lang concept        videos  avg views@48h  avg views now  like%  comments");
  for (const o of out) console.log(`${o.k.padEnd(18)} ${String(o.n).padStart(6)} ${String(o.views48).padStart(14)} ${String(o.views).padStart(14)} ${o.likeRate.padStart(6)} ${String(o.comments).padStart(9)}`);
}
