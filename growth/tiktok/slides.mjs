// TikTok slideshows v2: script (Gemini) -> two mood photos per post (Gemini image) -> 1080x1920 PNG slides with TikTok-native text.
//   node growth/tiktok/slides.mjs <lang> <pick|rank|found> <YYYY-MM-DD> [outDir]
// Writes <outDir>/<lang>_slides_<format>/01.png .. + meta.json (caption). Sound is added by hand on the phone: TikTok's API can't pick one.
// Look: one curated mood per post (Pinterest film photo, never messy rooms), a format-specific visual hook on slide 1
// (fanned face-down cards, a big rank number with the sign glyph, a single face-down card), and a comment question at the end.
import fs from "fs"; import path from "path"; import { createRequire } from "module"; import { fileURLToPath } from "url";
import { gemini, image } from "../studio/vertex.mjs"; import { CARD_NAMES, BANK } from "../studio/formats.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url)), [lang, fmt, iso, outArg] = process.argv.slice(2);
const OUT = path.join(outArg || path.join(HERE, "../out", iso), `${lang}_slides_${fmt}`); fs.mkdirSync(OUT, { recursive: true });
const url = (p) => "file:///" + path.resolve(p).replace(/\\/g, "/");
const LANG = { en: "American English, how a 24-year-old texts", tr: "günlük konuşma Türkçesi", pt: "Brazilian Portuguese, casual", es: "Mexican Spanish, casual", id: "bahasa gaul Indonesia", vi: "Vietnamese, casual" }[lang];
let seed = [...`${iso}|${lang}|${fmt}`].reduce((h, c) => (Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0), 2166136261) % 2147483647 || 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pickOf = (a) => a[Math.floor(rnd() * a.length)];

// ---- one mood per post: a hook photo and a calmer body photo that share light and palette
const MOODS = [
  { hook: "lit candles and a tarot deck on a linen tablecloth at night, dried flowers, warm amber glow", body: "soft out-of-focus candlelight bokeh on a dark wooden table, warm amber tones", ink: "#F3D9A4" },
  { hook: "full moon through a bedroom window with sheer white curtains, deep blue night, fairy lights", body: "deep blue night sky with thin clouds and faint stars", ink: "#C9D8FF" },
  { hook: "golden hour sun through a window onto white bed sheets, a single tarot card and a coffee cup", body: "golden hour light with soft leaf shadows on a cream wall", ink: "#FFE2A8" },
  { hook: "pink and lilac dusk sky over city rooftops seen from a balcony, string lights", body: "soft pink and lilac dusk sky with light clouds", ink: "#FFD3E2" },
  { hook: "rain drops on a window at night, warm city lights bokeh, a candle on the sill", body: "rain on glass with warm blurred city lights", ink: "#FFD9A0" },
  { hook: "tarot cards spread on a dark velvet cloth with crystals and a brass candle holder, moody", body: "dark velvet texture with a soft warm spotlight", ink: "#E9C98B" },
];
const mood = pickOf(MOODS);
const PHOTO = "Aesthetic 35mm film photo, soft natural grain, moodboard style, shallow depth of field, real place, no people, no text. Scene: ";
// the image model now and then returns nothing for a prompt: retry once with a plainer one
const shoot = async (scene, file) => { try { await image(PHOTO + scene, file); } catch (e) { await image("Soft film photo, no people, no text: " + scene, file); } };

const RULES = `You write viral TikTok photo slideshows about tarot and zodiac signs for women 18-34. Language: ${LANG}. It must read like a real person's post, not a brand.
The goal is saves, sends and comments: the reader thinks "this is literally me", "I need to send this to her" or "I have to comment my number".
- Build on feelings millions share: overthinking a text, being the strong friend, loving too hard, missing someone you shouldn't, starting over, being underestimated, a glow-up that is coming. Universal situations only: no brands, stores, workouts or oddly specific scenes.
- Lean warm and validating with a small sting of truth. Hopeful endings get saved; bleak ones get skipped.
- The hook is max 9 words and opens a loop she must close. Proven shapes: "pick a card to see what he won't say", "signs ranked by how hard they fall", "if this found you, it's not a coincidence", "the sign that will text you first this week", "your card for the rest of the month".
- First write 8 different hooks in "hooks", then put the strongest in "hook".
- Simple spoken words, mostly lowercase, no hashtags in slides, max one emoji in the whole post. Never write "swipe", "next" or "keep going".
- Banned: universe, energy, manifest, journey, divine, healing, "trust the process", "you deserve", "this is your sign", "vibes".
- No promises about health, money or a specific person's actions, no diagnosing, never praise or review a product.
- Before answering, reread every slide and rewrite any line that is generic, random, preachy or that fewer than a million women would see themselves in.`;

let brief, cards = [], n;
if (fmt === "pick") {
  while (cards.length < 3) { const c = Math.floor(rnd() * 78); if (!cards.includes(c)) cards.push(c); }
  brief = `Format: pick a card. The hook asks her to choose pile 1, 2 or 3 in her head, about something everyone wonders (what they really think of you, what is coming to you this month, the message you need tonight).
Card 1 = ${CARD_NAMES[cards[0]]}, card 2 = ${CARD_NAMES[cards[1]]}, card 3 = ${CARD_NAMES[cards[2]]}. Each reading uses the real meaning of its card, answers the hook directly and feels personal.
Return JSON: {"hooks":[8],"hook":"...","reveals":[{"title":"2-4 word headline for this pile, never the card name","text":"the reading, max 24 words"} x3],"end":"a comment question, max 10 words, e.g. which pile did you pick?","caption":"short natural caption + 3-4 hashtags"}`;
} else if (fmt === "rank") {
  const topic = pickOf(BANK.rank);
  brief = `Format: zodiac ranking, topic "${topic}" or a sharper angle on it. The hook makes every sign curious where she lands. Count down five signs from #5 to #1, each with one line so accurate it stings a little and gets tagged.
Return JSON: {"hooks":[8],"hook":"...","ranks":[{"sign":"zodiac sign name in ${LANG}","text":"max 18 words"} x5, ordered #5 first],"end":"a comment line, max 10 words, e.g. tag the sign you know","caption":"short natural caption + 3-4 hashtags"}`;
} else {
  cards = [Math.floor(rnd() * 78)];
  brief = `Format: "if this found you". One card chose her: ${CARD_NAMES[cards[0]]}. The hook says this post did not reach her by accident. Then a short, warm message built on the card's real meaning, written as if to one person, in three short slides, ending on a line she will screenshot.
Return JSON: {"hooks":[8],"hook":"...","title":"2-4 word headline for the card, never the card name","message":["slide text, max 20 words" x3],"end":"a comment line, max 8 words, e.g. type 'i claim it'","caption":"short natural caption + 3-4 hashtags"}`;
}
const scriptFile = path.join(OUT, "script.json");
const S = fs.existsSync(scriptFile) ? JSON.parse(fs.readFileSync(scriptFile, "utf8")) : await gemini(`${RULES}\n\n${brief}`);
fs.writeFileSync(scriptFile, JSON.stringify(S, null, 1));
if (process.env.SCRIPT_ONLY) process.exit(0);

// ---- two photos per post: cohesive, and a third of the image cost of one photo per slide
const bgHook = path.join(OUT, "bg_hook.jpg"), bgBody = path.join(OUT, "bg_body.jpg");
if (!fs.existsSync(bgHook)) await shoot(mood.hook, bgHook);
if (!fs.existsSync(bgBody)) await shoot(mood.body, bgBody);

// ---- slide pages
const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const cardImg = (c) => url(path.join(HERE, "../studio/assets/cards", String(c).padStart(2, "0") + ".jpg"));
const GLYPH = { aries: "♈", taurus: "♉", gemini: "♊", cancer: "♋", leo: "♌", virgo: "♍", libra: "♎", scorpio: "♏", sagittarius: "♐", capricorn: "♑", aquarius: "♒", pisces: "♓" };
const SIGN_EN = { koç: "aries", boğa: "taurus", ikizler: "gemini", yengeç: "cancer", aslan: "leo", başak: "virgo", terazi: "libra", akrep: "scorpio", yay: "sagittarius", oğlak: "capricorn", kova: "aquarius", balık: "pisces",
  áries: "aries", touro: "taurus", gêmeos: "gemini", câncer: "cancer", leão: "leo", virgem: "virgo", escorpião: "scorpio", sagitário: "sagittarius", capricórnio: "capricorn", aquário: "aquarius", peixes: "pisces",
  tauro: "taurus", géminis: "gemini", cáncer: "cancer", "león": "leo", virgo: "virgo", escorpio: "scorpio", sagitario: "sagittarius", capricornio: "capricorn", acuario: "aquarius", piscis: "pisces" };
const glyphOf = (s) => { const k = String(s).toLowerCase().trim(); return GLYPH[k] || GLYPH[SIGN_EN[k]] || "✦"; };
const back = (w) => `<svg class="back" width="${w}" height="${w * 1.72}" viewBox="0 0 100 172"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1F2550"/><stop offset="1" stop-color="#11142E"/></linearGradient></defs>
<rect x="1" y="1" width="98" height="170" rx="7" fill="url(#g)" stroke="#D9B56B" stroke-width="1.4"/><rect x="6" y="6" width="88" height="160" rx="4" fill="none" stroke="#D9B56B" stroke-width=".6" opacity=".8"/>
<path d="M57 70a16 16 0 1 0 0 32a20 20 0 1 1 0-32z" fill="#D9B56B"/><g fill="#D9B56B"><circle cx="30" cy="40" r="1.1"/><circle cx="70" cy="34" r="1.4"/><circle cx="74" cy="128" r="1.1"/><circle cx="26" cy="132" r="1.4"/><circle cx="50" cy="26" r=".9"/><circle cx="50" cy="146" r=".9"/></g>
<path d="M50 112l2 5 5 .4-4 3.2 1.4 5-4.4-2.8-4.4 2.8 1.4-5-4-3.2 5-.4z" fill="#D9B56B" opacity=".9"/></svg>`;

const CSS = `@font-face { font-family: TT; src: url(${url(path.join(HERE, "fonts/TikTokSans.ttf"))}); font-weight: 300 900; }
* { margin: 0; box-sizing: border-box; } body { width: 1080px; height: 1920px; position: relative; overflow: hidden; background: #111; font-family: TT, sans-serif; }
.bg { position: absolute; inset: 0; background-position: center; background-size: cover; }
.shade { position: absolute; inset: 0; background: linear-gradient(180deg, rgba(0,0,0,.18), rgba(0,0,0,.05) 40%, rgba(0,0,0,.35)); }
.box { text-align: center; } .l { display: inline; font-weight: 700; line-height: 1.52; color: #111; background: #fff; padding: 8px 20px; border-radius: 14px; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
.hookt .l { font-size: 82px; font-weight: 800; } .bodyt .l { font-size: 60px; }
.kick { display: inline-block; font-weight: 800; font-size: 50px; color: #fff; letter-spacing: .02em; text-shadow: 0 2px 14px rgba(0,0,0,.75); margin-bottom: 22px; }
.fan { position: absolute; left: 0; right: 0; display: flex; justify-content: center; align-items: flex-end; gap: 0; }
.fan .c { position: relative; margin: 0 -22px; filter: drop-shadow(0 26px 34px rgba(0,0,0,.55)); }
.fan .num { position: absolute; left: 50%; top: -110px; transform: translateX(-50%); width: 92px; height: 92px; border-radius: 50%; background: #fff; color: #111; font-weight: 800; font-size: 56px; display: grid; place-items: center; }
.front { position: absolute; left: 50%; transform: translateX(-50%) rotate(-2deg); border-radius: 24px; box-shadow: 0 30px 70px rgba(0,0,0,.6); }
.rk { position: absolute; left: 0; right: 0; top: 330px; text-align: center; color: #fff; text-shadow: 0 4px 30px rgba(0,0,0,.6); }
.rk .no { font-weight: 900; font-size: 250px; line-height: .9; letter-spacing: -.04em; }
.rk .gl { font-family: "DejaVu Sans", "Segoe UI Symbol", "Noto Sans Symbols", sans-serif; font-size: 170px; line-height: 1; margin-top: 10px; color: var(--ink); }
.rk .nm { font-weight: 800; font-size: 64px; letter-spacing: .14em; text-transform: uppercase; margin-top: 16px; }
.tag { position: absolute; left: 0; right: 0; bottom: 300px; text-align: center; font-weight: 600; font-size: 38px; color: #fff; text-shadow: 0 2px 8px rgba(0,0,0,.9); }`;
const shell = (bg, inner, blur = 0) => `<!doctype html><meta charset="utf-8"><style>${CSS} :root { --ink: ${mood.ink}; }</style>
<div class="bg" style="background-image:url(${url(bg)});${blur ? `filter: blur(${blur}px) brightness(.78); transform: scale(1.08);` : "filter: brightness(.9);"}"></div><div class="shade"></div>${inner}`;
const text = (t, cls, top) => `<div class="box ${cls}" style="position:absolute;left:70px;right:70px;top:${top}px"><span class="l">${esc(t).replace(/\n/g, "<br>")}</span></div>`;
const kick = (t, top) => `<div style="position:absolute;left:0;right:0;top:${top}px;text-align:center"><span class="kick">${esc(t)}</span></div>`;
// a headline that only repeats the card name says nothing: the card name is already shown above it
const fresh = (t, c) => !!t && !CARD_NAMES[c].toLowerCase().includes(String(t).toLowerCase().replace(/^the /, "").trim());
const tag = `<div class="tag">sussa · free tarot on google play</div>`;

const pages = [];
if (fmt === "pick") {
  pages.push(shell(bgHook, text(S.hook, "hookt", 300) + `<div class="fan" style="top:1010px">${[1, 2, 3].map((k, i) => `<div class="c" style="transform:rotate(${(i - 1) * 9}deg) translateY(${i === 1 ? -30 : 0}px)"><div class="num">${k}</div>${back(300)}</div>`).join("")}</div>`));
  S.reveals.forEach((r, i) => pages.push(shell(bgBody, `<img class="front" src="${cardImg(cards[i])}" style="top:230px;width:560px">` + kick(`${i + 1} · ${CARD_NAMES[cards[i]].toLowerCase()}`, 1250) + text(fresh(r.title, cards[i]) ? `${r.title}\n${r.text}` : r.text, "bodyt", 1340), 16)));
} else if (fmt === "rank") {
  pages.push(shell(bgHook, text(S.hook, "hookt", 640)));
  S.ranks.forEach((r, i) => pages.push(shell(bgBody, `<div class="rk"><div class="no">#${5 - i}</div><div class="gl">${glyphOf(r.sign)}&#xFE0E;</div><div class="nm">${esc(r.sign)}</div></div>` + text(r.text, "bodyt", 1180), 10)));
} else {
  pages.push(shell(bgHook, text(S.hook, "hookt", 300) + `<div class="fan" style="top:1000px"><div class="c" style="transform:rotate(-3deg)">${back(380)}</div></div>`));
  pages.push(shell(bgBody, `<img class="front" src="${cardImg(cards[0])}" style="top:250px;width:600px">` + kick(CARD_NAMES[cards[0]].toLowerCase(), 1330) + (fresh(S.title, cards[0]) ? text(S.title, "bodyt", 1420) : ""), 16));
  S.message.forEach((m) => pages.push(shell(bgBody, text(m, "bodyt", 760), 10)));
}
pages.push(shell(bgHook, text(S.end, "hookt", 700) + tag, 6));

const req = createRequire(process.env.PW_REQUIRE || path.join(HERE, "../../package.json")), { chromium } = req("playwright-core");
const br = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), tab = await br.newPage({ viewport: { width: 1080, height: 1920 } });
for (let i = 0; i < pages.length; i++) {
  const f = path.join(OUT, `page_${i}.html`); fs.writeFileSync(f, pages[i]);
  await tab.goto(url(f)); await tab.waitForTimeout(300);
  await tab.screenshot({ path: path.join(OUT, `${String(i + 1).padStart(2, "0")}.png`) }); fs.rmSync(f);
}
await br.close();
fs.writeFileSync(path.join(OUT, "meta.json"), JSON.stringify({ lang, kind: `slides_${fmt}`, date: iso, caption: S.caption, n: pages.length }, null, 1));
console.log(`saved ${OUT} (${pages.length} slides)`);
