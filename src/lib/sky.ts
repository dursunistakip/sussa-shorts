// The app's daily horoscope engine, ported from the Unity app (Core/Astro.cs, Weather.cs, Cosmos.cs) so the website shows
// exactly the reading Sussa shows on a phone for the same sign and day: real planet positions, meters that come from them,
// and the same text pools (src/data/horo/<lang>.json, exported by ContentSrc/export_horo_web.py).
import en from "@/data/horo/en.json";
import tr from "@/data/horo/tr.json";
import pt from "@/data/horo/pt.json";
import es from "@/data/horo/es.json";
import id from "@/data/horo/id.json";
import vi from "@/data/horo/vi.json";
import type { Lang } from "./tarot-i18n";

export const SIGNS = ["aries", "taurus", "gemini", "cancer", "leo", "virgo", "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"] as const;
export type Sign = (typeof SIGNS)[number];
export const ELEMENTS = ["fire", "earth", "air", "water", "fire", "earth", "air", "water", "fire", "earth", "air", "water"];
const MODALITIES = ["cardinal", "fixed", "mutable", "cardinal", "fixed", "mutable", "cardinal", "fixed", "mutable", "cardinal", "fixed", "mutable"];
export const RULERS = ["mars", "venus", "mercury", "moon", "sun", "mercury", "venus", "pluto", "jupiter", "saturn", "uranus", "neptune"];
export const signIndex = (s: string) => (SIGNS as readonly string[]).indexOf(s);

const TEXT: Record<Lang, Record<string, string>> = { en, tr, pt, es, id, vi };
export const t = (lang: Lang, key: string) => TEXT[lang][key] ?? TEXT.en[key] ?? key;
const count = (lang: Lang, prefix: string) => { let n = 0; while (`${prefix}.${n}` in TEXT[lang] || `${prefix}.${n}` in TEXT.en) n++; return n; };
export const item = (lang: Lang, prefix: string, i: number) => t(lang, `${prefix}.${i}`);

// ------------------------------------------------------------------------------------------------ ephemeris (Astro.cs)
export const BODIES = ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "uranus", "neptune"] as const;
const SUN = 0, MOON = 1, MERCURY = 2, VENUS = 3, MARS = 4, JUPITER = 5, SATURN = 6;
const RAD = Math.PI / 180;
const norm = (d: number) => { d %= 360; return d < 0 ? d + 360 : d; };
const sin = (d: number) => Math.sin(d * RAD), cos = (d: number) => Math.cos(d * RAD);
const dayNum = (ms: number) => ms / 86400000 + 2440587.5 - 2451543.5;

type Orbit = { N: number; i: number; w: number; a: number; e: number; M: number };
function elements(body: number, d: number): Orbit {
  switch (body) {
    case MOON: return { N: 125.1228 - 0.0529538083 * d, i: 5.1454, w: 318.0634 + 0.1643573223 * d, a: 60.2666, e: 0.0549, M: 115.3654 + 13.0649929509 * d };
    case MERCURY: return { N: 48.3313 + 3.24587e-5 * d, i: 7.0047 + 5.0e-8 * d, w: 29.1241 + 1.01444e-5 * d, a: 0.387098, e: 0.205635 + 5.59e-10 * d, M: 168.6562 + 4.0923344368 * d };
    case VENUS: return { N: 76.6799 + 2.4659e-5 * d, i: 3.3946 + 2.75e-8 * d, w: 54.891 + 1.38374e-5 * d, a: 0.72333, e: 0.006773 - 1.302e-9 * d, M: 48.0052 + 1.6021302244 * d };
    case MARS: return { N: 49.5574 + 2.11081e-5 * d, i: 1.8497 - 1.78e-8 * d, w: 286.5016 + 2.92961e-5 * d, a: 1.523688, e: 0.093405 + 2.516e-9 * d, M: 18.6021 + 0.5240207766 * d };
    case JUPITER: return { N: 100.4542 + 2.76854e-5 * d, i: 1.303 - 1.557e-7 * d, w: 273.8777 + 1.64505e-5 * d, a: 5.20256, e: 0.048498 + 4.469e-9 * d, M: 19.895 + 0.0830853001 * d };
    case SATURN: return { N: 113.6634 + 2.3898e-5 * d, i: 2.4886 - 1.081e-7 * d, w: 339.3939 + 2.97661e-5 * d, a: 9.55475, e: 0.055546 - 9.499e-9 * d, M: 316.967 + 0.0334442282 * d };
    case 7: return { N: 74.0005 + 1.3978e-5 * d, i: 0.7733 + 1.9e-8 * d, w: 96.6612 + 3.0565e-5 * d, a: 19.18171 - 1.55e-8 * d, e: 0.047318 + 7.45e-9 * d, M: 142.5905 + 0.011725806 * d };
    default: return { N: 131.7806 + 3.0173e-5 * d, i: 1.77 - 2.55e-7 * d, w: 272.8461 - 6.027e-6 * d, a: 30.05826 + 3.313e-8 * d, e: 0.008606 + 2.15e-9 * d, M: 260.2471 + 0.005995147 * d };
  }
}
function kepler(o: Orbit) {
  const M = norm(o.M);
  let E = M + (180 / Math.PI) * o.e * sin(M) * (1 + o.e * cos(M));
  for (let k = 0; k < 8; k++) { const dE = (E - (180 / Math.PI) * o.e * sin(E) - M) / (1 - o.e * cos(E)); E -= dE; if (Math.abs(dE) < 1e-7) break; }
  const xv = o.a * (cos(E) - o.e), yv = o.a * Math.sqrt(1 - o.e * o.e) * sin(E);
  return { v: Math.atan2(yv, xv) / RAD, r: Math.hypot(xv, yv) };
}
function sun2(d: number) {
  const w = 282.9404 + 4.70935e-5 * d, e = 0.016709 - 1.151e-9 * d, M = 356.047 + 0.9856002585 * d;
  const { v, r } = kepler({ N: 0, i: 0, w, a: 1, e, M });
  return { lon: norm(v + w), r };
}
function moonLon(d: number, sunLon: number) {
  const o = elements(MOON, d), { v, r } = kepler(o), vw = v + o.w;
  const xh = r * (cos(o.N) * cos(vw) - sin(o.N) * sin(vw) * cos(o.i)), yh = r * (sin(o.N) * cos(vw) + cos(o.N) * sin(vw) * cos(o.i));
  let lon = Math.atan2(yh, xh) / RAD;
  const Mm = norm(o.M), Ms = norm(356.047 + 0.9856002585 * d), Lm = norm(o.N + o.w + o.M), D = norm(Lm - sunLon), F = norm(Lm - o.N);
  lon += -1.274 * sin(Mm - 2 * D) + 0.658 * sin(2 * D) - 0.186 * sin(Ms) - 0.059 * sin(2 * Mm - 2 * D) - 0.057 * sin(Mm - 2 * D + Ms) + 0.053 * sin(Mm + 2 * D)
    + 0.046 * sin(2 * D - Ms) + 0.041 * sin(Mm - Ms) - 0.035 * sin(D) - 0.031 * sin(Mm + Ms) - 0.015 * sin(2 * F - 2 * D) + 0.011 * sin(Mm - 4 * D);
  return norm(lon);
}
export function longitude(body: number, ms: number) {
  const d = dayNum(ms), s = sun2(d);
  if (body === SUN) return s.lon;
  if (body === MOON) return moonLon(d, s.lon);
  const o = elements(body, d), { v, r } = kepler(o), vw = v + o.w;
  const xh = r * (cos(o.N) * cos(vw) - sin(o.N) * sin(vw) * cos(o.i)), yh = r * (sin(o.N) * cos(vw) + cos(o.N) * sin(vw) * cos(o.i));
  return norm(Math.atan2(yh + s.r * sin(s.lon), xh + s.r * cos(s.lon)) / RAD);
}
const signOfLon = (lon: number) => Math.floor(norm(lon) / 30) % 12;
function retrograde(body: number, ms: number) {
  if (body === SUN || body === MOON) return false;
  let diff = longitude(body, ms + 12 * 3600000) - longitude(body, ms - 12 * 3600000);
  if (diff > 180) diff -= 360; if (diff < -180) diff += 360;
  return diff < 0;
}
function moonPhase(ms: number) {
  const e = norm(longitude(MOON, ms) - longitude(SUN, ms));
  return { phase: Math.floor(e / 45 + 0.5) % 8, illum: (1 - cos(e)) * 0.5, elong: e };
}
const house = (userSign: number, bodySign: number) => (((bodySign - userSign) % 12) + 12) % 12 + 1;
function aspect(a: number, b: number) { let d = Math.abs(a - b) % 12; if (d > 6) d = 12 - d; return d === 0 ? 0 : d === 2 ? 2 : d === 3 ? 3 : d === 4 ? 4 : d === 6 ? 6 : -1; }
export const tone = (a: number) => (a === 4 || a === 2 ? "good" : a === 3 || a === 6 ? "tense" : a === 0 ? "conj" : "none");
export const aspectKey = (a: number) => (a === 0 ? "conj" : a === 2 ? "sextile" : a === 3 ? "square" : a === 4 ? "trine" : a === 6 ? "opp" : "none");

// ------------------------------------------------------------------------------------------------ Cosmos.Hash (FNV-style, uint)
export function hash(...parts: number[]) {
  let h = 2166136261;
  for (const p of parts) { h = (h ^ (p >>> 0)) >>> 0; h = Math.imul(h, 16777619) >>> 0; h = (h ^ (h >>> 15)) >>> 0; }
  return h;
}
// C# DateTime.DayOfYear for a calendar date
const dayOfYear = (y: number, m: number, d: number) => Math.round((Date.UTC(y, m - 1, d) - Date.UTC(y, 0, 1)) / 86400000) + 1;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
// Unity's Mathf.RoundToInt rounds halves to even
const roundEven = (x: number) => { const f = Math.floor(x), r = x - f; return r > 0.5 || (r === 0.5 && f % 2 !== 0) ? f + 1 : f; };

export type YMD = { y: number; m: number; d: number };
export const ymdIn = (tz: string, ms = Date.now()): YMD => {
  const p = new Intl.DateTimeFormat("en-CA", { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(new Date(ms));
  const g = (k: string) => +p.find((x) => x.type === k)!.value;
  return { y: g("year"), m: g("month"), d: g("day") };
};
export const addDays = (a: YMD, n: number): YMD => { const x = new Date(Date.UTC(a.y, a.m - 1, a.d + n)); return { y: x.getUTCFullYear(), m: x.getUTCMonth() + 1, d: x.getUTCDate() }; };

// ------------------------------------------------------------------------------------------------ Weather.Compute (no birth chart)
export interface Why { planet: number; aspect: number }
export interface Sky {
  lon: number[]; signOf: number[]; retro: boolean[];
  phase: number; illum: number; waxing: boolean; moonHouse: number;
  love: number; career: number; money: number; energy: number;
  loveWhy: Why; careerWhy: Why; moneyWhy: Why; energyWhy: Why;
}
const score = (a: number, trine: number, sextile: number, conj: number, square: number, opp: number) =>
  a === 4 ? trine : a === 2 ? sextile : a === 0 ? conj : a === 3 ? square : a === 6 ? opp : 0;

export function weather(sign: number, date: YMD, hourUtc = 12): Sky {
  const ms = Date.UTC(date.y, date.m - 1, date.d, hourUtc);
  const lon = BODIES.map((_, i) => longitude(i, ms)), signOf = lon.map(signOfLon), retro = BODIES.map((_, i) => retrograde(i, ms));
  const { phase, illum, elong } = moonPhase(ms);
  const moonHouse = house(sign, signOf[MOON]);
  const day = date.y * 400 + dayOfYear(date.y, date.m, date.d);
  const noise = (salt: number) => (hash(day, sign, salt) % 13) - 6;
  const asp = (p: number) => aspect(signOf[p], sign);
  const aV = asp(VENUS), aS = asp(SATURN), aM = asp(MERCURY), aJ = asp(JUPITER), aMa = asp(MARS);
  const inH = (...hs: number[]) => hs.includes(moonHouse);
  const love = 58 + score(aV, 20, 13, 16, -12, -8) + (inH(5, 7) ? 8 : 0) + (phase === 4 ? 4 : 0) + noise(1);
  const career = 60 + score(aS, 11, 8, 2, -9, -9) + score(aM, 8, 6, 5, -6, -5) + (retro[MERCURY] ? -7 : 0) + (inH(6, 10) ? 8 : 0) + noise(2);
  const money = 56 + score(aJ, 17, 11, 14, -7, -5) + score(aV, 5, 4, 5, -3, -2) + (inH(2, 8) ? 8 : 0) + noise(3);
  const energy = 58 + score(aMa, 15, 10, 11, -11, -8) + roundEven(illum * 8) + (moonHouse === 1 ? 8 : 0) + (elong < 180 ? 3 : 0) + noise(4);
  let careerWhy: Why = Math.abs(score(aS, 11, 8, 2, -9, -9)) >= Math.abs(score(aM, 8, 6, 5, -6, -5)) ? { planet: SATURN, aspect: aS } : { planet: MERCURY, aspect: aM };
  if (retro[MERCURY]) careerWhy = { planet: MERCURY, aspect: -2 };
  return {
    lon, signOf, retro, phase, illum, waxing: elong < 180, moonHouse,
    love: clamp(love, 34, 98), career: clamp(career, 34, 98), money: clamp(money, 34, 98), energy: clamp(energy, 34, 98),
    loveWhy: { planet: VENUS, aspect: aV }, careerWhy, moneyWhy: { planet: JUPITER, aspect: aJ }, energyWhy: { planet: MARS, aspect: aMa },
  };
}

// ------------------------------------------------------------------------------------------------ Cosmos.Daily: the text picks
export interface Daily {
  open: string; love: string; career: string; money: string; energy: string; advice: string; flavor: string;
  luckyNumber: number; luckyColor: string; luckyColorIndex: number; luckyTime: string;
}
export function daily(lang: Lang, sign: number, date: YMD): Daily {
  const day = date.y * 400 + dayOfYear(date.y, date.m, date.d);
  const h = (salt: number) => hash(day, sign, salt);
  const pick = (salt: number, n: number) => h(salt) % Math.max(1, n);
  const s = SIGNS[sign];
  const colorIdx = pick(22, Math.max(1, count(lang, "color")));
  const hour = 6 + pick(23, 17), minute = pick(24, 12) * 5;
  return {
    open: item(lang, "hs.open", pick(31, count(lang, "hs.open"))),
    love: item(lang, "hs.love", pick(32, count(lang, "hs.love"))),
    career: item(lang, "hs.career", pick(33, count(lang, "hs.career"))),
    money: item(lang, "hs.money", pick(34, count(lang, "hs.money"))),
    energy: item(lang, "hs.energy", pick(35, count(lang, "hs.energy"))),
    advice: item(lang, "hs.advice", pick(36, count(lang, "hs.advice"))),
    flavor: item(lang, `sign.${s}.flavor`, pick(37, Math.max(1, count(lang, `sign.${s}.flavor`)))),
    luckyNumber: 1 + (h(21) % 99), luckyColor: item(lang, "color", colorIdx), luckyColorIndex: colorIdx,
    luckyTime: `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`,
  };
}

// the sentence that explains a meter from the sky (TodayScreen.SkyLine) and its short label (TodayScreen.Why)
export const skyLine = (lang: Lang, w: Why) => (w.aspect === -2 ? t(lang, "astro.mercury.retro") : t(lang, `astro.${BODIES[w.planet]}.${tone(w.aspect)}`));
export const whyLabel = (lang: Lang, w: Why) =>
  w.aspect === -2 ? `${t(lang, "pl.mercury")} · ${t(lang, "astro.retro")}` : `${t(lang, `pl.${BODIES[w.planet]}`)} ${t(lang, `astro.asp.${aspectKey(w.aspect)}`)}`;

// card of the day for a sign (Cosmos.DailyCard with no personal seed)
export function dailyCard(sign: number, date: YMD) {
  const h = hash(date.y * 400 + dayOfYear(date.y, date.m, date.d), sign, 0, 7);
  return { card: h % 22, reversed: ((h >>> 9) % 4) === 0 };
}

// compatibility 0-100 (Cosmos.Compatibility) and the element pair text key
export function compatibility(a: number, b: number) {
  const ea = ELEMENTS[a], eb = ELEMENTS[b];
  let base: number;
  if (ea === eb) base = 82;
  else if ((ea === "fire" && eb === "air") || (ea === "air" && eb === "fire")) base = 90;
  else if ((ea === "earth" && eb === "water") || (ea === "water" && eb === "earth")) base = 88;
  else if ((ea === "fire" && eb === "water") || (ea === "water" && eb === "fire")) base = 52;
  else if ((ea === "earth" && eb === "air") || (ea === "air" && eb === "earth")) base = 56;
  else base = 58;
  if (Math.abs(a - b) === 6) base += 6;
  if (MODALITIES[a] === MODALITIES[b] && a !== b) base -= 3;
  const wobble = (hash(Math.min(a, b), Math.max(a, b), 99) % 9) - 4;
  return clamp(base + wobble, 38, 99);
}
export const pairKey = (a: number, b: number) => { const x = ELEMENTS[a], y = ELEMENTS[b]; return x <= y ? `${x}_${y}` : `${y}_${x}`; };
export const modality = (s: number) => MODALITIES[s];
