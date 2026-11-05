// Vertex AI calls for the studio pipeline: Gemini text (scripts) and Gemini TTS (voice).
// Credentials: VERTEX_SA_JSON (service account JSON, GitHub secret) or the local key file. Never printed.
import fs from "fs"; import crypto from "crypto";
const PROJECT = "gen-lang-client-0868298952";
let cached;
async function token() {
  if (cached && cached.exp > Date.now() + 60000) return cached.tok;
  const sa = JSON.parse(process.env.VERTEX_SA_JSON || fs.readFileSync(process.env.VERTEX_KEY || "D:/Temp/keys/vertex.json", "utf8"));
  const now = Math.floor(Date.now() / 1000), b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const head = b64({ alg: "RS256", typ: "JWT" }), body = b64({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/cloud-platform", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 });
  const sig = crypto.createSign("RSA-SHA256").update(`${head}.${body}`).sign(sa.private_key, "base64url");
  const r = await (await fetch("https://oauth2.googleapis.com/token", { method: "POST", body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${head}.${body}.${sig}` }) })).json();
  if (!r.access_token) throw new Error("vertex auth failed: " + (r.error || "?"));
  cached = { tok: r.access_token, exp: Date.now() + r.expires_in * 1000 }; return cached.tok;
}
async function generate(model, body, tries = 3) {
  const url = `https://aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/global/publishers/google/models/${model}:generateContent`;
  for (let i = 1; ; i++) {
    // a hung request (no headers for minutes) counts as a retryable failure instead of killing the build
    const r = await fetch(url, { method: "POST", headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" }, body: JSON.stringify(body), signal: AbortSignal.timeout(150000) })
      .catch((e) => ({ ok: false, status: 0, text: async () => String(e.cause || e) }));
    if (r.ok) return r.json();
    const msg = `${model} ${r.status}: ${(await r.text()).slice(0, 300)}`;
    if (i >= tries || ![0, 429, 500, 503].includes(r.status)) throw new Error(msg);
    await new Promise((s) => setTimeout(s, 4000 * i));
  }
}
// JSON answer from Gemini (responseMimeType json)
export async function gemini(prompt, { model = "gemini-3.1-pro-preview", temperature = 1 } = {}) {
  const d = await generate(model, { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { temperature, responseMimeType: "application/json" } });
  const text = d.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";
  return JSON.parse(text.replace(/^```json\s*|```\s*$/g, ""));
}
// one image from Gemini (9:16 by default)
export async function image(prompt, file, { model = "gemini-2.5-flash-image", aspect = "9:16" } = {}) {
  const d = await generate(model, { contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseModalities: ["IMAGE"], imageConfig: { aspectRatio: aspect } } }, 7);
  const part = d.candidates?.[0]?.content?.parts?.find((x) => x.inlineData);
  if (!part) throw new Error("no image returned");
  fs.writeFileSync(file, Buffer.from(part.inlineData.data, "base64")); return file;
}
// one Veo clip (9:16) from a prompt, optionally a first-frame image, or a previous Veo clip to continue as one take
// (the result of a continuation holds the whole take; it needs 720p and personGeneration allow_all when a person is on screen)
export async function veo(prompt, file, { model = "veo-3.1-fast-generate-001", image: img, video, audio = false, seconds = 8, resolution = "1080p", negative } = {}) {
  const base = `https://us-central1-aiplatform.googleapis.com/v1/projects/${PROJECT}/locations/us-central1/publishers/google/models/${model}`;
  const call = async (u, body) => { const r = await fetch(u, { method: "POST", headers: { Authorization: `Bearer ${await token()}`, "Content-Type": "application/json" }, body: JSON.stringify(body) });
    if (!r.ok) throw new Error(`veo ${r.status}: ${(await r.text()).slice(0, 300)}`); return r.json(); };
  const inst = { prompt, ...(img ? { image: { bytesBase64Encoded: fs.readFileSync(img).toString("base64"), mimeType: "image/jpeg" } } : {}),
    ...(video ? { video: { bytesBase64Encoded: fs.readFileSync(video).toString("base64"), mimeType: "video/mp4" } } : {}) };
  const op = await call(`${base}:predictLongRunning`, { instances: [inst], parameters: { aspectRatio: "9:16", sampleCount: 1, durationSeconds: seconds, generateAudio: audio, resolution, ...(negative ? { negativePrompt: negative } : {}), personGeneration: video ? "allow_all" : "allow_adult" } });
  for (;;) {
    await new Promise((s) => setTimeout(s, 10000));
    const r = await call(`${base}:fetchPredictOperation`, { operationName: op.name });
    if (!r.done) continue;
    const v = r.response?.videos?.[0]; if (!v) throw new Error(`veo: no video ${JSON.stringify(r.error || r.response).slice(0, 300)}`);
    fs.writeFileSync(file, Buffer.from(v.bytesBase64Encoded, "base64")); return file;
  }
}
// 24 kHz mono 16-bit PCM wrapped as WAV
export async function tts(text, file, { voice = "Aoede", style, lang, model = "gemini-2.5-pro-tts" } = {}) {
  // Pro voice first; if it keeps failing, the flash voice (same speaker) still beats the old renderer
  const req = { contents: [{ role: "user", parts: [{ text: `${style}\n\n${text}` }] }],
    generationConfig: { responseModalities: ["AUDIO"], speechConfig: { ...(lang ? { languageCode: lang } : {}), voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } } } };
  const d = await generate(model, req).catch((e) => { console.error(`tts ${model} failed, using flash: ${e.message.slice(0, 120)}`); return generate("gemini-2.5-flash-tts", req); });
  const pcm = Buffer.from(d.candidates[0].content.parts[0].inlineData.data, "base64");
  const h = Buffer.alloc(44); h.write("RIFF", 0); h.writeUInt32LE(36 + pcm.length, 4); h.write("WAVEfmt ", 8); h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(1, 22);
  h.writeUInt32LE(24000, 24); h.writeUInt32LE(48000, 28); h.writeUInt16LE(2, 32); h.writeUInt16LE(16, 34); h.write("data", 36); h.writeUInt32LE(pcm.length, 40);
  fs.writeFileSync(file, Buffer.concat([h, pcm])); return pcm.length / 48000;
}
