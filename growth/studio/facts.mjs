// Real-sky facts for a date (same ephemeris as the app and asksussa.com), handed to the script writer so videos talk about the actual sky.
export function skyFacts(sky, date) {
  const P = ["new moon", "waxing crescent", "first quarter", "waxing gibbous", "full moon", "waning gibbous", "last quarter", "waning crescent"];
  const S = sky.SIGNS, B = sky.BODIES, ms = (d, h = 12) => Date.UTC(d.y, d.m - 1, d.d, h);
  const elong = (t) => ((sky.longitude(1, t) - sky.longitude(0, t)) % 360 + 360) % 360;
  const sgn = (lon) => S[Math.floor((((lon % 360) + 360) % 360) / 30)];
  const iso = (d) => `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
  const w = sky.weather(0, date);
  const out = {
    date: iso(date), weekday: new Date(ms(date)).toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" }),
    sunSign: S[w.signOf[0]], moonSign: S[w.signOf[1]], moonPhase: P[w.phase], moonIllumination: Math.round(w.illum * 100) + "%",
    retrograde: B.filter((_, i) => w.retro[i]), upcoming: [],
  };
  // lunations, sign ingresses of the Sun and retrograde stations in the next 14 days
  for (let i = 0; i < 14; i++) {
    const a = sky.addDays(date, i), b = sky.addDays(date, i + 1), ta = ms(a, 0), tb = ms(b, 0);
    const ea = elong(ta), eb = elong(tb);
    if (ea > 300 && eb < 60) out.upcoming.push({ date: iso(a), event: `new moon in ${sgn(sky.longitude(1, tb))}` });
    if (ea < 180 && eb >= 180) out.upcoming.push({ date: iso(a), event: `full moon in ${sgn(sky.longitude(1, tb))}` });
    if (sgn(sky.longitude(0, ta)) !== sgn(sky.longitude(0, tb))) out.upcoming.push({ date: iso(a), event: `the Sun enters ${sgn(sky.longitude(0, tb))} (${sgn(sky.longitude(0, tb))} season begins)` });
    const wa = sky.weather(0, a), wb = sky.weather(0, b);
    B.forEach((p, k) => { if (wa.retro[k] !== wb.retro[k]) out.upcoming.push({ date: iso(a), event: `${p} ${wb.retro[k] ? "turns retrograde" : "turns direct"} in ${S[wb.signOf[k]]}` }); });
  }
  // "big sky day": a lunation or station today or tomorrow puts the sky-news format on the schedule
  out.bigDay = out.upcoming.find((e) => e.date <= iso(sky.addDays(date, 1)) && !/enters/.test(e.event)) || null;
  return out;
}
