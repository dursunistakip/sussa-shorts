// Writes one video's script, title, description and hashtags with Gemini, from the format plan and the real-sky facts.
import { gemini } from "./vertex.mjs";
const LANG = { en: "English (US, Gen-Z/millennial TikTok voice)", tr: "Turkish (Türkiye, samimi ve doğal, genç kadın dili)", pt: "Brazilian Portuguese (natural, warm, Gen-Z)",
  es: "Latin American Spanish (Mexico, natural, warm)", id: "Indonesian (casual, natural, young women)", vi: "Vietnamese (natural, warm, young women)" };
const SEO = {
  en: "Search terms people use: pick a card, tarot reading, daily tarot, zodiac signs, horoscope, astrology, full moon, mercury retrograde, love tarot, yes or no tarot, + sign names.",
  tr: "Aranan kelimeler: tarot falı, kart seç, günlük burç yorumları, burçlar, astroloji, dolunay, merkür retrosu, aşk falı, evet hayır tarot, + burç adları.",
  pt: "Termos buscados: tarot, escolha uma carta, tiragem de tarot, signos, horóscopo do dia, astrologia, lua cheia, mercúrio retrógrado, tarot do amor, sim ou não, + nomes dos signos.",
  es: "Términos buscados: tarot, elige una carta, lectura de tarot, signos, horóscopo de hoy, astrología, luna llena, mercurio retrógrado, tarot del amor, sí o no, + nombres de signos.",
  id: "Kata kunci: tarot, pilih kartu, ramalan tarot, zodiak, ramalan zodiak hari ini, astrologi, bulan purnama, merkurius retrograde, tarot cinta, + nama zodiak.",
  vi: "Từ khóa: tarot, chọn một lá bài, bói bài tarot, cung hoàng đạo, tử vi hôm nay, chiêm tinh, trăng tròn, sao thủy nghịch hành, tarot tình yêu, + tên cung.",
};

export async function writeScript({ lang, fmt, plan, facts }) {
  const fields = plan.segs.map((s) => `- "${s.id}": ${s.fields}`).join("\n");
  const prompt = `You write short vertical videos (YouTube Shorts / TikTok, 30-45 seconds) for Sussa, a free tarot & daily horoscope app that uses the REAL sky.
Audience: women 16-34 who love tarot and astrology. Language of EVERYTHING you write: ${LANG[lang]}. Write natively in that language, never translated-sounding.

FORMAT: ${fmt}
BRIEF: ${plan.brief}
REAL SKY FACTS (only use these for any astrology claim, dates included): ${JSON.stringify(facts)}

Voice-over rules:
- It is read by one warm young woman talking to a friend. Short sentences, spoken rhythm, contractions, no stage directions, no emoji in "vo".
- The first 3 words of the hook must stop the scroll (curiosity, direct address, or a bold claim). No greetings, no "hey guys", no "welcome".
- Be specific and emotionally true; the viewer must recognize herself. Gentle wording: "the energy says", "this week asks you to" — never promise outcomes, never health/money guarantees.
- Banned: delve, tapestry, journey, embrace, unlock, realm, "the universe has a plan", "buckle up", "in today's video", hashtags inside vo.
- Total spoken length across all segments: ${fmt === "weekly" ? "110-130" : "75-105"} words.
- Weave ONE engagement ask naturally into the hook or the last content segment (comment / save / send to a friend), as described in the brief.

Fill these segments (keep the ids, keep this order). Every segment except "hook" and "cta" also gets "mood": the feeling of its footage, one of calm, love, power, fun, sad, self, hope, sky.
${fields}

Also write:
- "title": YouTube Shorts title, max 70 characters, starts with the strongest search phrase for this video (see search terms), curiosity-driven, 1 emoji max, end with " #shorts".
- "description": 2-3 natural lines for YouTube that repeat the main search phrases (no links, the app link is added after), then a blank line, then 6-8 hashtags mixing broad and specific (include sign/card names that appear).
- "tags": 12-15 YouTube tags (search phrases, lowercase).
- "tiktok": TikTok caption: one hook line (max 90 chars) + a line break + 4-5 hashtags (2 broad like #tarot #fyp-equivalent for the language, 2-3 specific). No links.
${SEO[lang]}

Return JSON only: {"segments": {"<id>": {...fields}}, "title": "", "description": "", "tags": [], "tiktok": ""}`;
  const out = await gemini(prompt);
  for (const s of plan.segs) if (!out.segments?.[s.id]?.vo) throw new Error(`script missing segment ${s.id}`);
  return out;
}
