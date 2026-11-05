// TikTok slideshows: script (Gemini) -> phone-photo backgrounds (Gemini image) -> 1080x1920 PNG slides with TikTok-native text.
//   node growth/tiktok/slides.mjs <lang> <pick|rank|found> <YYYY-MM-DD> [outDir]
// Writes <outDir>/<lang>_slides_<format>/01.png .. + meta.json (caption). Sound is added by hand on the phone: TikTok's API can't pick one.
import fs from "fs"; import path from "path"; import { createRequire } from "module"; import { fileURLToPath } from "url";
import { gemini, image } from "../studio/vertex.mjs"; import { CARD_NAMES, BANK } from "../studio/formats.mjs";

const HERE = path.dirname(fileURLToPath(import.meta.url)), [lang, fmt, iso, outArg] = process.argv.slice(2);
const OUT = path.join(outArg || path.join(HERE, "../out", iso), `${lang}_slides_${fmt}`); fs.mkdirSync(OUT, { recursive: true });
const url = (p) => "file:///" + path.resolve(p).replace(/\\/g, "/");
const LANG = { en: "American English, how a 24-year-old texts", tr: "günlük konuşma Türkçesi", pt: "Brazilian Portuguese, casual", es: "Mexican Spanish, casual", id: "bahasa gaul Indonesia", vi: "Vietnamese, casual" }[lang];
let seed = [...`${iso}|${lang}|${fmt}`].reduce((h, c) => (Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0), 2166136261) % 2147483647 || 7;
const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const pickOf = (a) => a[Math.floor(rnd() * a.length)];

const RULES = `You write TikTok photo slideshows for women 18-34 who love tarot and astrology. Language: ${LANG}.
It must read like a real person's post, not a brand. Rules:
- Slide 1 is one concrete, oddly specific situation or claim that makes her stop (a person, a text, a place, a time). Never a generic "your energy is shifting".
- One idea per slide, max 16 words, simple words. Each slide must make her want the next one. Mostly lowercase, no hashtags, max one emoji in the whole post.
- Be specific and a little funny or a little brutal. Banned: universe, energy, manifest, journey, divine, healing, "trust the process", "you deserve", "this is your sign".
- Gentle truth only: no promises about health, money or a specific person's actions.
- Never write as someone who used an app, and never praise or review a product.`;
const SHAPE = (n) => `Return JSON: {"slides":[{"text":"...","scene":"one short English description of an ordinary photo that fits"}] (exactly ${n}), "caption":"short natural caption + 3-4 hashtags"}.
"scene" is an unglamorous everyday setting (unmade bed, car at night, kitchen table, bathroom mirror with no face, coffee on a windowsill). No faces, no text in the scene.`;

let brief, cards = [];
if (fmt === "pick") {
  while (cards.length < 3) { const c = Math.floor(rnd() * 78); if (!cards.includes(c)) cards.push(c); }
  brief = `Format: swipe-to-pick. Slide 1 tells her to choose 1, 2 or 3 silently before swiping, about one specific situation (invent it). Slides 2-4 reveal card 1 = ${CARD_NAMES[cards[0]]}, card 2 = ${CARD_NAMES[cards[1]]}, card 3 = ${CARD_NAMES[cards[2]]}: each "text" is the number and card name, a newline, then what it says about that situation, true to the card's meaning. Slide 5 asks which one she picked and why it hit.\n${SHAPE(5)}`;
} else if (fmt === "rank") {
  const topic = pickOf(BANK.rank);
  brief = `Format: zodiac ranking, topic "${topic}". Slide 1 is the hook. Slides 2-6 count down from 5 to 1, each naming a zodiac sign with one painfully specific, funny line. Slide 7: ask them to comment who you forgot.\n${SHAPE(7)}`;
} else {
  brief = `Format: "this found you". A short story in slides that speaks directly to a woman in one specific moment (invent one: waiting for a reply, about to text an ex, staying in a job she hates...). Slide 1 is the hook, slides 2-5 build, slide 6 lands one honest sentence she will want to send to a friend.\n${SHAPE(6)}`;
}
const scriptFile = path.join(OUT, "script.json");
const S = fs.existsSync(scriptFile) ? JSON.parse(fs.readFileSync(scriptFile, "utf8")) : await gemini(`${RULES}\n\n${brief}`);
fs.writeFileSync(scriptFile, JSON.stringify(S, null, 1));

// backgrounds: flat, slightly imperfect phone photos, the opposite of the glossy studio look
const PHOTO = "Candid amateur iPhone photo, slightly grainy, uneven indoor light, ordinary real home, not staged, not cinematic, no people visible, no text, no letters, no logos. Scene: ";
const bgs = S.slides.map((_, i) => path.join(OUT, `bg_${i}.jpg`));
for (let i = 0; i < S.slides.length; i++) if (!fs.existsSync(bgs[i])) await image(PHOTO + S.slides[i].scene, bgs[i]);   // one at a time: the image quota is low

const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
const page = (s, i) => {
  const card = fmt === "pick" && i >= 1 && i <= 3 ? path.join(HERE, "../studio/assets/cards", String(cards[i - 1]).padStart(2, "0") + ".jpg") : null;
  const [first, ...rest] = s.text.split("\n"), lines = card && rest.length ? [first, rest.join(" ")] : [s.text];
  return `<!doctype html><meta charset="utf-8"><style>
@font-face { font-family: TT; src: url(${url(path.join(HERE, "fonts/TikTokSans.ttf"))}); font-weight: 300 900; }
* { margin: 0; box-sizing: border-box; } body { width: 1080px; height: 1920px; position: relative; overflow: hidden; background: #111; font-family: TT, sans-serif; }
.bg { position: absolute; inset: 0; background: url(${url(bgs[i])}) center/cover; ${card ? "filter: blur(14px) brightness(.7); transform: scale(1.1);" : "filter: brightness(.86);"} }
.card { position: absolute; left: 50%; top: 210px; transform: translateX(-50%) rotate(-2deg); width: 560px; border-radius: 22px; box-shadow: 0 24px 60px rgba(0,0,0,.55); }
.txt { position: absolute; left: 70px; right: 70px; top: ${card ? 1230 : 620}px; text-align: center; }
.l { display: inline; font-weight: 700; font-size: ${i === 0 ? 74 : 62}px; line-height: 1.5; color: #111; background: #fff; padding: 8px 18px; border-radius: 14px; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
.n { display: block; font-weight: 800; font-size: 54px; color: #fff; text-shadow: 0 2px 10px rgba(0,0,0,.8); margin-bottom: 18px; }
</style><div class="bg"></div>${card ? `<img class="card" src="${url(card)}">` : ""}
<div class="txt">${lines.length > 1 ? `<span class="n">${esc(lines[0])}</span><span class="l">${esc(lines[1])}</span>` : `<span class="l">${esc(lines[0]).replace(/\n/g, "<br>")}</span>`}</div>`;
};
const req = createRequire(process.env.PW_REQUIRE || path.join(HERE, "../../package.json")), { chromium } = req("playwright-core");
const br = await chromium.launch(process.env.CHROME ? { executablePath: process.env.CHROME } : {}), tab = await br.newPage({ viewport: { width: 1080, height: 1920 } });
for (let i = 0; i < S.slides.length; i++) {
  const f = path.join(OUT, `page_${i}.html`); fs.writeFileSync(f, page(S.slides[i], i));
  await tab.goto(url(f)); await tab.waitForTimeout(250);
  await tab.screenshot({ path: path.join(OUT, `${String(i + 1).padStart(2, "0")}.png`) }); fs.rmSync(f);
}
await br.close();
fs.writeFileSync(path.join(OUT, "meta.json"), JSON.stringify({ lang, kind: `slides_${fmt}`, date: iso, caption: S.caption, n: S.slides.length }, null, 1));
console.log(`saved ${OUT} (${S.slides.length} slides)`);
