// The ten Sussa Shorts formats: which segments a video has (the engine owns the structure and visuals),
// what the script writer fills in, and the topic banks that keep every day different.
const MAJOR = ["The Fool", "The Magician", "The High Priestess", "The Empress", "The Emperor", "The Hierophant", "The Lovers", "The Chariot", "Strength", "The Hermit",
  "Wheel of Fortune", "Justice", "The Hanged Man", "Death", "Temperance", "The Devil", "The Tower", "The Star", "The Moon", "The Sun", "Judgement", "The World"];
const RANKS = ["Ace", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Page", "Knight", "Queen", "King"];
export const CARD_NAMES = [...MAJOR, ...["Wands", "Cups", "Swords", "Pentacles"].flatMap((s) => RANKS.map((r) => `${r} of ${s}`))];
const NO = [13, 15, 16, 40, 52, 54, 58, 59, 68], WAIT = [2, 12, 18, 42, 51, 70];   // same verdicts as the app's yes/no ritual
export const verdictOf = (card) => (NO.includes(card) ? "no" : WAIT.includes(card) ? "wait" : "yes");

// weekday (0 = Sunday) -> the day's two formats
export const WEEK = [["weekly", "found"], ["pick", "rank"], ["yesno", "signsas"], ["found", "compat"], ["sky", "pov"], ["pick", "myth"], ["yesno", "rank"]];

export const BANK = {
  rank: ["most likely to text their ex this week", "who falls in love the fastest", "best at keeping a secret", "most likely to ghost you (and come back)", "who overthinks a text the most",
    "most dramatic when they're sick", "who'd survive a horror movie", "most likely to cry at a wedding", "who gives the best advice but never takes it", "most likely to stalk your ex's new partner",
    "who's secretly the funniest", "most likely to fall for someone they just met", "who holds a grudge the longest", "best friend to call at 3am", "most likely to start over in a new city",
    "who says 'I'm fine' when they're not", "most likely to manifest a dream life", "who forgives the fastest", "most jealous (but won't admit it)", "most likely to get back together with an ex",
    "who's luckiest with money this month", "most likely to plan a trip and never go", "who loves the hardest", "who needs a break the most right now", "most likely to have a glow-up this season"],
  signsas: ["the signs at 2am", "the signs when their crush texts back", "the signs on a first date", "the signs when someone says 'we need to talk'", "the signs at a party",
    "the signs when they're mad at you", "the signs during a breakup", "the signs on a Monday morning", "the signs when they get paid", "the signs when their phone is at 1%",
    "the signs in a group project", "the signs when they see their ex", "the signs waiting for a reply", "the signs as texts they never sent", "the signs when they can't sleep",
    "the signs on vacation", "the signs when someone flirts with them", "the signs when they're in love and won't admit it", "the signs getting ready to go out", "the signs during mercury retrograde"],
  pov: ["you pulled the Tower the night before a big exam", "your ex texts 'hey' the same day you pull the Lovers", "you asked the cards if they like you back", "you finally stopped checking if they watched your story",
    "you pulled Death and panicked (it's not what you think)", "your best friend reads your cards and goes quiet", "you asked if you should quit your job", "the full moon makes you clean your whole room at midnight",
    "you said 'this is the last time' for the fifth time", "you pulled the Star after the worst month of your life", "you're a Scorpio and someone lied to you", "you asked the deck about your crush and got the Fool",
    "you keep seeing 11:11 and then this happens", "you're healing and the universe tests you with a text", "your mom asks why you have so many candles", "you pulled three swords cards in a row",
    "you stopped chasing and they came back", "you booked the trip you kept postponing", "you ignored your intuition one more time", "you finally chose yourself"],
  myth: [13, 16, 15, 12, 18, 9, 0, 54, 52, 62, 50, 40, 59, 44, 58, 10, 20, 6],   // cards people fear or misread
};

// segment plans: the writer fills the listed fields; the engine draws the visuals
export function plan(fmt, rnd, used) {
  const pickCard = (avoid = []) => { let c; do c = Math.floor(rnd() * 78); while (avoid.includes(c) || used.cards.includes(c)); return c; };
  const pickTopic = (k) => { const fresh = BANK[k].filter((t) => !used.topics.includes(t)); const pool = fresh.length ? fresh : BANK[k]; return pool[Math.floor(rnd() * pool.length)]; };
  const signs = (n) => { const a = [...Array(12).keys()]; for (let i = 11; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, n); };
  const hook = { id: "hook", type: "hook", fields: "vo (the spoken hook, max 16 words, first 3 words must stop the scroll), kicker (2-3 word label for a gold pill, e.g. PICK A CARD), headline (on-screen line, max 6 words, lowercase, no emoji)" };
  const cta = { id: "cta", type: "cta", fields: "vo (max 22 words: why Sussa gives YOUR personal reading from your sign and today's real sky, every morning; must say 'Sussa' and that it's free on Google Play; warm, not salesy)" };
  if (fmt === "pick") {
    const cards = []; for (let i = 0; i < 3; i++) cards.push(pickCard(cards));
    return { mood: ["ritual"], segs: [{ ...hook, clip: "r_lay", numbers: true }, ...cards.map((c, i) => ({ id: `c${i + 1}`, type: "card", card: c, label: i + 1,
      fields: `vo (starts with the natural spoken way to say 'card number ${i + 1}' in the video language, number as a word, then the card name, then a 2-sentence message for this week built on the real meaning of ${CARD_NAMES[c]}; specific, emotional, second person), name (card name in the video language)` })), cta],
      brief: `Pick-a-card reading. Cards: 1 = ${CARD_NAMES[cards[0]]}, 2 = ${CARD_NAMES[cards[1]]}, 3 = ${CARD_NAMES[cards[2]]}. Ask viewers to comment their number.`, cards };
  }
  if (fmt === "found") {
    const c = pickCard();
    return { segs: [{ ...hook, clip: "ritual" }, { id: "card", type: "card", card: c, label: 0, fields: `vo (name the card ${CARD_NAMES[c]} and what it says to the person watching right now, 2 sentences), name (card name in the video language)` },
      { id: "msg", type: "text", fields: "vo (2 sentences: the one thing to do or let go this week, concrete and gentle), kicker (2 words), heading (max 7 words)" }, cta],
      brief: `"If this video found you" single-card message with ${CARD_NAMES[c]}. Make it feel personal, like the card chose the viewer. Ask them to type 'I claim it' or save it.`, cards: [c] };
  }
  if (fmt === "yesno") {
    const c = pickCard(), v = verdictOf(c);
    return { segs: [{ ...hook, clip: "ritual" }, { id: "card", type: "card", card: c, label: 0, verdict: v, fields: `vo (name the card ${CARD_NAMES[c]} and give the answer: ${v.toUpperCase()}; one sentence why, from the card's meaning), name (card name in the video language), verdict (the word ${v} in the video language, 1-2 words)` },
      { id: "why", type: "text", fields: "vo (2 sentences: what the answer means in practice and what to do next), kicker (2 words), heading (max 7 words)" }, cta],
      brief: `Yes/No tarot: viewer thinks of a question, the card answers ${v.toUpperCase()}. Tell them to hold their question in mind and not scroll. Ask them to comment their answer.`, cards: [c] };
  }
  if (fmt === "rank" || fmt === "signsas") {
    const topic = pickTopic(fmt), n = fmt === "rank" ? 5 : 6, ss = signs(n);
    return { segs: [hook, ...ss.map((s, i) => ({ id: `s${i + 1}`, type: "item", sign: s, badge: fmt === "rank" ? `#${n - i}` : "", fields: `vo (${fmt === "rank" ? `the spoken words for 'number ${n - i}' (number as a word) + ` : ""}the sign name + one funny, painfully relatable line, max 14 words), line (on-screen version, max 7 words)` })), cta],
      brief: fmt === "rank" ? `Ranking: "${topic}". Countdown from #${n} to #1 using these signs in this order: ${ss.map((s) => sky_sign(s)).join(", ")}. Funny and accurate to each sign's personality. Ask viewers to comment if their sign is right.` :
        `"${topic}" — one relatable line per sign for: ${ss.map((s) => sky_sign(s)).join(", ")}. Funny, specific, screenshot-worthy. Tell viewers to tag a friend.`, topic };
  }
  if (fmt === "weekly") {
    return { segs: [hook, ...[...Array(12).keys()].map((s) => ({ id: `s${s + 1}`, type: "item", sign: s, fast: true, fields: "vo (sign name + this week's message in max 10 words, grounded in the real sky facts), line (same message, max 7 words)" })), cta],
      brief: "The 12 signs' message for the coming week, Aries to Pisces, using the real sky (moon phases, retrogrades, ingresses). Tell viewers to pause on their sign and save it." };
  }
  if (fmt === "compat") {
    const ss = signs(6), pairs = [[ss[0], ss[1]], [ss[2], ss[3]], [ss[4], ss[5]]];
    return { segs: [hook, ...pairs.map((p, i) => ({ id: `p${i + 1}`, type: "pair", signs: p, fields: "vo (the two signs + how this pairing really feels in love, one honest and one sweet line, max 22 words), line (verdict, max 5 words)" })), cta],
      brief: `Zodiac compatibility: ${pairs.map((p) => `${sky_sign(p[0])} + ${sky_sign(p[1])}`).join(", ")}. Use real elemental chemistry. Tell viewers to send it to the sign they're with.`, pairs };
  }
  if (fmt === "sky") {
    return { segs: [{ ...hook, clip: "sky" }, ...[1, 2, 3].map((i) => ({ id: `f${i}`, type: "text", fields: `vo (${i === 1 ? "what is happening in the sky and when, exact dates from the facts" : i === 2 ? "what to do with it" : "what NOT to do"}, max 22 words), kicker (2 words, e.g. ${i === 1 ? "WHAT'S HAPPENING" : i === 2 ? "DO THIS" : "AVOID THIS"}), heading (max 7 words)` })), cta],
      brief: "Sky news: the most important real event in the facts (big day first, else the next lunation or retrograde). Accurate dates only from the facts. Tell viewers to save it." };
  }
  if (fmt === "myth") {
    const pool = BANK.myth.filter((c) => !used.cards.includes(c)), c = (pool.length ? pool : BANK.myth)[Math.floor(rnd() * (pool.length || BANK.myth.length))];
    return { segs: [{ ...hook, clip: "ritual" }, { id: "myth", type: "text", fields: "vo (what people think this card means, 1 sentence), kicker (2 words, e.g. THE MYTH), heading (max 7 words)" },
      { id: "card", type: "card", card: c, label: 0, fields: `vo (what ${CARD_NAMES[c]} really means, 2 sentences), name (card name in the video language)` },
      { id: "tip", type: "text", fields: "vo (when you pull it, do this, 1-2 sentences), kicker (2 words), heading (max 7 words)" }, cta],
      brief: `Myth vs truth about ${CARD_NAMES[c]}. Open with the fear, reveal the real meaning. Ask viewers which card scares them.`, cards: [c] };
  }
  if (fmt === "pov") {
    const topic = pickTopic("pov"), c = pickCard();
    return { segs: [{ ...hook, fields: "vo (the POV line said naturally, max 16 words), kicker ('POV'), headline (the POV in max 9 words, lowercase)" },
      { id: "b1", type: "text", fields: "vo (what happens first, max 18 words, a tiny story beat), kicker (1-2 words), heading (max 7 words)" },
      { id: "b2", type: "text", fields: "vo (the twist or feeling, max 18 words), kicker (1-2 words), heading (max 7 words)" },
      { id: "card", type: "card", card: c, label: 0, fields: `vo (the card ${CARD_NAMES[c]} shows up and what it tells them, max 22 words), name (card name in the video language)` }, cta],
      brief: `POV mini-story: "${topic}". Relatable, a little funny, ends with a comforting card message. Ask viewers if this happened to them.`, topic, cards: [c] };
  }
  throw new Error("unknown format " + fmt);
}
let sky_sign = (s) => String(s);
export const setSignNames = (f) => { sky_sign = f; };
