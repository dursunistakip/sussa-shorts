// YouTube Shorts uploader for the daily Sussa videos (YouTube Data API v3, resumable upload).
//   node growth/youtube.mjs auth <lang>            one-time: opens Google sign-in, pick the channel for <lang>, stores the refresh token
//   node growth/youtube.mjs upload <file.mp4>      uploads with the title/description/tags in the matching .json
// Credentials: YT_CLIENT_ID / YT_CLIENT_SECRET (OAuth "Desktop app" client) and YT_REFRESH_<LANG> (env, e.g. GitHub secrets);
// locally the auth step writes D:\SussaApp\Signing\youtube_<lang>.json, which upload also reads. Tokens are never printed.
import fs from "fs"; import http from "http"; import path from "path";

const [cmd, arg] = process.argv.slice(2);
const YT_LANG = { pt: "pt-BR", es: "es-419" };   // the channels' audiences: Brazil, Latin America
const SECRETS = process.env.YT_SECRETS_DIR || "D:/SussaApp/Signing";
const client = () => {
  if (process.env.YT_CLIENT_ID) return { id: process.env.YT_CLIENT_ID, secret: process.env.YT_CLIENT_SECRET };
  const j = JSON.parse(fs.readFileSync(path.join(SECRETS, "youtube_client.json"), "utf8")); const c = j.installed || j.web;
  return { id: c.client_id, secret: c.client_secret };
};
const refreshFor = (lang) => process.env[`YT_REFRESH_${lang.toUpperCase()}`] || JSON.parse(fs.readFileSync(path.join(SECRETS, `youtube_${lang}.json`), "utf8")).refresh_token;

async function token(lang) {
  const c = client();
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", body: new URLSearchParams({ client_id: c.id, client_secret: c.secret, refresh_token: refreshFor(lang), grant_type: "refresh_token" }) });
  const j = await r.json(); if (!j.access_token) throw new Error("token refresh failed: " + (j.error || r.status));
  return j.access_token;
}

if (cmd === "auth") {
  const lang = arg; if (!lang) throw new Error("usage: auth <lang>");
  const c = client(), port = 53682, redirect = `http://127.0.0.1:${port}`;
  const scope = "https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/yt-analytics.readonly";
  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${new URLSearchParams({ client_id: c.id, redirect_uri: redirect, response_type: "code", scope, access_type: "offline", prompt: "consent select_account" })}`;
  console.log(`Open this link, sign in and choose the YouTube channel for "${lang}":\n${authUrl}`);
  const code = await new Promise((res) => {
    const srv = http.createServer((q, s) => { const u = new URL(q.url, redirect); const k = u.searchParams.get("code"); s.end(k ? "Sussa: done, you can close this tab." : "No code"); if (k) { srv.close(); res(k); } }).listen(port);
  });
  const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", body: new URLSearchParams({ code, client_id: c.id, client_secret: c.secret, redirect_uri: redirect, grant_type: "authorization_code" }) });
  const j = await r.json(); if (!j.refresh_token) throw new Error("no refresh token: " + (j.error || r.status));
  fs.writeFileSync(path.join(SECRETS, `youtube_${lang}.json`), JSON.stringify({ refresh_token: j.refresh_token }));
  const me = await (await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", { headers: { Authorization: `Bearer ${j.access_token}` } })).json();
  console.log(`saved youtube_${lang}.json for channel: ${me.items?.[0]?.snippet?.title || "?"}`);
} else if (cmd === "upload") {
  const file = arg, meta = JSON.parse(fs.readFileSync(file.replace(/\.mp4$/, ".json"), "utf8"));
  const access = await token(meta.lang);
  // Actions runners start empty, so a re-run would upload twice: skip when the channel's recent uploads already have this title
  const api = (u) => fetch(`https://www.googleapis.com/youtube/v3/${u}`, { headers: { Authorization: `Bearer ${access}` } }).then((r) => r.json());
  const uploads = (await api("channels?part=contentDetails&mine=true")).items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  const recent = uploads ? (await api(`playlistItems?part=snippet&maxResults=20&playlistId=${uploads}`)).items || [] : [];
  const dup = recent.find((v) => v.snippet?.title === meta.title);
  if (dup) { console.log(`already on the channel: ${meta.title} -> https://youtube.com/shorts/${dup.snippet.resourceId.videoId}`); process.exit(0); }
  const body = {
    snippet: { title: meta.title, description: meta.description, tags: meta.tags, categoryId: "24", defaultLanguage: YT_LANG[meta.lang] || meta.lang, defaultAudioLanguage: YT_LANG[meta.lang] || meta.lang },
    // a future publishAt (set by daily.mjs) uploads it private and YouTube makes it public then, so a channel's videos come out hours apart
    status: { ...(Date.parse(meta.publishAt) > Date.now() + 60e3 ? { privacyStatus: "private", publishAt: meta.publishAt } : { privacyStatus: process.env.YT_PRIVACY || "public" }),
      selfDeclaredMadeForKids: false, containsSyntheticMedia: !!meta.synthetic },   // Veo footage is disclosed as altered/synthetic
  };
  const size = fs.statSync(file).size;
  const init = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
    method: "POST", headers: { Authorization: `Bearer ${access}`, "Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Length": String(size), "X-Upload-Content-Type": "video/mp4" }, body: JSON.stringify(body),
  });
  if (!init.ok) throw new Error(`upload init ${init.status}: ${await init.text()}`);
  const put = await fetch(init.headers.get("location"), { method: "PUT", headers: { "Content-Type": "video/mp4", "Content-Length": String(size) }, body: fs.readFileSync(file) });
  const j = await put.json(); if (!j.id) throw new Error(`upload ${put.status}: ${JSON.stringify(j).slice(0, 300)}`);
  console.log(`uploaded ${path.basename(file)} -> https://youtube.com/shorts/${j.id}${meta.publishAt ? ` (public at ${meta.publishAt})` : ""}`);
  fs.appendFileSync(path.join(path.dirname(file), "uploaded.txt"), `${path.basename(file)}\t${j.id}\n`);
} else {
  console.log("usage: node growth/youtube.mjs auth <lang> | upload <file.mp4>");
}
