// Concept videos for the 15-day format test (growth/plan.json). Each builder returns { html, dur, title, lines, bg? } and animates
// through data attributes read by RUNTIME below: data-in/out (fade in/out, data-fx up|pop|left|right|zoom|none), data-type (typed
// text), data-count (counter), data-bar (width %), data-flip (card turn). Optional `extra` JS runs in seek(t) after the generic pass.
import { CONTENT, WORDS, pickLang } from "./content.mjs";

export const RUNTIME = `(t) => {
  const cl = (x) => Math.max(0, Math.min(1, x)), ease = (x) => 1 - Math.pow(1 - x, 3);
  for (const e of document.querySelectorAll("[data-in]")) {
    const a = +e.dataset.in, b = e.dataset.out ? +e.dataset.out : 1e9, f = +(e.dataset.f || .35), fx = e.dataset.fx || "up";
    e.style.opacity = cl((t - a) / f) * cl((b - t) / f);
    const p = ease(cl((t - a) / f));
    e.style.transform = fx === "up" ? "translateY(" + (1 - p) * 40 + "px)" : fx === "pop" ? "scale(" + (0.6 + 0.4 * p + 0.08 * Math.sin(p * Math.PI)) + ")"
      : fx === "left" ? "translateX(" + (1 - p) * -80 + "px)" : fx === "right" ? "translateX(" + (1 - p) * 80 + "px)"
      : fx === "zoom" ? "scale(" + (1 + 0.06 * cl((t - a) / Math.max(1, Math.min(b, 60) - a))) + ")" : "none";
  }
  for (const e of document.querySelectorAll("[data-type]")) {
    const a = +e.dataset.type, s = e.dataset.text, n = Math.floor(cl((t - a) * +(e.dataset.cps || 26) / s.length) * s.length);
    e.textContent = s.slice(0, n);
    const c = e.nextElementSibling; if (c && c.classList.contains("caret")) c.style.opacity = t < a ? 0 : n < s.length || Math.floor(t * 2.4) % 2 ? 1 : 0;
  }
  for (const e of document.querySelectorAll("[data-count]")) e.textContent = Math.round(+e.dataset.to * ease(cl((t - +e.dataset.count) / +(e.dataset.dur || 1)))) + (e.dataset.suf || "");
  for (const e of document.querySelectorAll("[data-bar]")) e.style.width = +e.dataset.to * ease(cl((t - +e.dataset.bar) / 1)) + "%";
  for (const e of document.querySelectorAll("[data-flip]")) e.style.transform = "rotateY(" + 180 * ease(cl((t - +e.dataset.flip) / .8)) + "deg)";
  if (window.extra) window.extra(t, cl, ease);
}`;

const at = (a, b, fx, f) => ` data-in="${a}"${b != null ? ` data-out="${b}"` : ""}${fx ? ` data-fx="${fx}"` : ""}${f ? ` data-f="${f}"` : ""}`;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
const typed = (a, s, cps = 26) => `<span data-type="${a}" data-cps="${cps}" data-text="${esc(s)}"></span>`;
const fill = (s, v) => s.replace("{0}", v);
const HEX = ["#FF7F6B", "#E9B949", "#C8A2E8", "#2E9E6E", "#7CC4F2", "#E8899E", "#F0A030", "#F2EBDD", "#1F8A8A", "#B3243B", "#3F3FA0", "#FFB38A"];

// a playing card that turns over at `flipAt` (back -> face)
function card(c, img, w, h, flipAt, rev) {
  return `<div style="width:${w}px;height:${h}px;perspective:2200px"><div data-flip="${flipAt}" style="position:relative;width:100%;height:100%;transform-style:preserve-3d">
    <div class="back" style="position:absolute;inset:0;backface-visibility:hidden"></div>
    <div class="face" style="position:absolute;inset:0;backface-visibility:hidden;transform:rotateY(180deg)${rev ? " rotateZ(180deg)" : ""};background-image:url(${img})"></div></div></div>`;
}

export function concepts(ctx) {
  const { sky, lang, date, dateText, TAROT, cardImg, signImg, V, A, url, W } = ctx;
  const Wd = pickLang(WORDS, lang), C = pickLang(CONTENT, lang);
  const sn = (i) => sky.t(lang, `sign.${sky.SIGNS[i]}.name`);
  const day = date.y * 400 + date.m * 31 + date.d;
  const tc = (n) => TAROT[n].t[lang] || TAROT[n].t.en;
  const endCard = (a) => `<div class="layer"${at(a, null, "none", .5)} style="background:#0E0A24 url(${url(A + "/bg_reading.jpg")}) center/cover">
    <div class="shade"></div>
    <img src="${url(A + "/pose_cards.png")}" style="position:absolute;top:260px;left:${(W - 600) / 2}px;width:600px;height:880px;object-fit:contain;object-position:bottom;-webkit-mask-image:linear-gradient(#000 80%,transparent)">
    <div style="position:absolute;top:1190px;left:80px;right:80px;text-align:center;color:#FFF3E4">
      <div class="h" style="font-size:84px">${V.cta}</div>
      <div style="margin-top:40px;display:inline-block;padding:26px 48px;border-radius:999px;background:#FF6B57;font-family:BodyB;font-size:44px">${V.app}</div>
    </div><div class="brand">SUSSA</div></div>`;
  const totals = sky.SIGNS.map((_, i) => { const w = sky.weather(i, date); return { i, w, all: Math.round((w.love + w.career + w.money + w.energy) / 4) }; });

  // ---------------------------------------------------------------------------------------------- group chat
  function chat(ep) {
    // bubbles wrap at ~34 characters; each row is as tall as its text, and the feed scrolls so the newest bubble stays in view
    const c = C["chat" + ep], step = 1.75, t0 = 0.5, top = 470, view = 1330;
    const hs = c.msgs.map(([, m]) => 118 + 52 * Math.ceil(m.length / 34)), ys = hs.map((_, k) => hs.slice(0, k).reduce((a, b) => a + b, 0));
    const outro = t0 + c.msgs.length * step + 1.2, fin = outro + 4.2;
    const html = `<style>.cb{position:absolute;left:40px;right:40px;display:flex;gap:18px;align-items:flex-end}.cb img{width:76px;height:76px;border-radius:50%;flex:none}
      .cb .bub{background:#E9E9EB;color:#111;border-radius:34px;padding:20px 30px;font-family:Body;font-size:42px;line-height:1.22;max-width:800px}
      .cb .who{font-family:Body;font-size:27px;color:#8A8A8E;margin:0 0 6px 30px}</style>
      <div style="position:absolute;top:0;left:0;right:0;height:420px;background:#F6F6F8;border-bottom:1px solid #DDD;z-index:2">
        <div style="position:absolute;top:250px;left:0;right:0;text-align:center;font-family:BodyB;font-size:44px;color:#111">${c.group}</div>
        <div style="position:absolute;top:312px;left:0;right:0;text-align:center;font-family:Body;font-size:30px;color:#8A8A8E">${Wd.members}</div></div>
      <div style="position:absolute;top:70px;left:60px;right:60px;z-index:3;text-align:center"><span style="display:inline-block;background:#111;color:#fff;font-family:BodyB;font-size:46px;line-height:1.25;padding:18px 30px;border-radius:22px">${c.title}</span></div>
      <div style="position:absolute;top:${top}px;left:0;right:0;height:${view}px;overflow:hidden"><div id="feed" style="position:absolute;left:0;right:0;top:0">
      ${c.msgs.map(([s, m], k) => `<div class="cb"${at(t0 + k * step, null, "pop", .25)} style="top:${ys[k]}px;transform-origin:left bottom"><img src="${signImg(s)}"><div><div class="who">${sn(s)}</div><div class="bub">${esc(m)}</div></div></div>`).join("")}
      </div></div>
      <div class="layer"${at(outro, null, "none", .4)} style="z-index:10;background:rgba(10,8,20,.92);display:grid;place-items:center"><div class="h" style="font-size:66px;line-height:1.2;color:#FFF3E4;text-align:center;padding:0 100px">${esc(c.outro)}</div></div>
      <div style="position:absolute;inset:0;z-index:11;pointer-events:none">${endCard(fin)}</div>`;
    const extra = `window.extra = (t, cl, ease) => { const ys = ${JSON.stringify(ys.map((y, k) => Math.max(0, y + hs[k] - view + 30)))};
      let k = Math.max(0, Math.min(ys.length - 1, Math.floor((t - ${t0}) / ${step}))); const f = ease(cl((t - ${t0} - k * ${step}) / .35)), p = k ? ys[k - 1] : 0;
      document.getElementById("feed").style.transform = "translateY(" + -(p + (ys[k] - p) * f) + "px)"; };`;
    return { html, extra, dur: fin + 4.5, bg: "#FFFFFF", title: `${c.title} #zodiac #astrology #shorts`, lines: c.msgs.map(([s, m]) => `${sn(s)}: ${m}`) };
  }

  // ---------------------------------------------------------------------------------------------- notes app list
  function notes(ep) {
    const c = C["notes" + ep]; let t = 1.6; const rows = [];
    for (const l of c.lines) { rows.push(`<div style="margin-top:34px;display:flex;gap:20px"><span${at(t, null, "none", .1)}>•</span><span>${typed(t, l, 24)}</span></div>`); t += Math.max(1.9, l.length / 24 + 0.9); }
    const outro = t + 0.8, fin = outro + 4;
    const html = `<div style="position:absolute;top:150px;left:60px;right:60px;font-family:Body;color:#E0A100;font-size:44px">‹ ${Wd.notes}</div>
      <div style="position:absolute;top:250px;left:70px;right:70px;color:#1C1C1E">
        <div style="font-family:Body;font-size:30px;color:#8E8E93;text-align:center">${Wd.today}, ${dateText}</div>
        <div style="font-family:BodyB;font-size:72px;line-height:1.15;margin-top:40px">${typed(0.2, c.head, 30)}<span class="caret" style="color:#E0A100">|</span></div>
        <div style="font-family:Body;font-size:58px;line-height:1.3;margin-top:30px">${rows.join("")}</div></div>
      <div style="position:absolute;left:70px;right:70px;bottom:250px;font-family:Body;font-size:40px;line-height:1.3;color:#8E8E93"${at(outro, fin, "up")}>${esc(c.outro)}</div>
      ${endCard(fin)}`;
    return { html, dur: fin + 4.5, bg: "#FFFDF7", title: `${c.title} #${sky.SIGNS[c.sign]} #zodiac #shorts`, lines: c.lines };
  }

  // ---------------------------------------------------------------------------------------------- myth buster
  function myth(ep) {
    const c = C["myth" + ep], k = tc(c.card);
    const html = `<div style="position:absolute;top:200px;left:70px;right:70px;text-align:center">
        <div class="h" style="font-size:96px"${at(0.1, 4.6, "pop")}>${esc(c.hook)}</div></div>
      <div style="position:absolute;top:760px;left:0;right:0;text-align:center"><div class="i" style="font-size:80px;color:#F6C766"${at(2.6, 4.6)}>${esc(c.calm)}</div></div>
      <div style="position:absolute;top:150px;left:${(W - 460) / 2}px"${at(4.8, null, "none")}>${card(c.card, cardImg(c.card), 460, 760, 5.0)}</div>
      <div style="position:absolute;top:960px;left:80px;right:80px;text-align:center">
        <div class="h" style="font-size:80px"${at(5.9)}>${k.name}</div>
        <div class="cap" style="margin-top:34px"${at(6.8, 12.4)}>${esc(c.real)}</div>
        <div class="i" style="font-size:52px;margin-top:22px"${at(7.2, 12.4)}>${esc(k.up)}</div></div>
      <div style="position:absolute;top:1130px;left:80px;right:80px;text-align:center">
        <div class="cap"${at(12.8, 18.6)}>${sky.t(lang, "home.love")}</div><div class="i" style="font-size:52px;margin-top:22px"${at(13.1, 18.6)}>${esc(k.love)}</div></div>
      <div style="position:absolute;top:1450px;left:80px;right:80px;text-align:center"><div class="h" style="font-size:54px;color:#F6C766"${at(15.4, 18.6)}>“${esc(k.advice)}”</div></div>
      ${endCard(19)}`;
    return { html, dur: 23.5, title: `${c.title} #tarot #tarotreading #shorts`, lines: [k.name, k.up, k.love, k.advice] };
  }

  // ---------------------------------------------------------------------------------------------- one rule per sign
  function retro(ep) {
    const c = C["retro" + ep], per = 1.9, t0 = 2.6, fin = t0 + 12 * per + 0.6;
    const html = `<div style="position:absolute;top:640px;left:70px;right:70px;text-align:center"${at(0.1, t0, "pop")}>
        <div class="h" style="font-size:110px">${c.head}</div><div class="i" style="font-size:62px;margin-top:20px;color:#F6C766">${c.sub}</div></div>
      ${c.rules.map((r, i) => `<div class="layer"${at(t0 + i * per, t0 + (i + 1) * per, "right", .25)}>
        <img src="${signImg(i)}" style="position:absolute;top:420px;left:${(W - 380) / 2}px;width:380px;height:380px;border-radius:50%;border:5px solid #F6C766">
        <div style="position:absolute;top:880px;left:80px;right:80px;text-align:center"><div class="cap">${c.head}</div>
        <div class="h" style="font-size:96px;margin-top:20px">${sn(i)}</div><div class="i" style="font-size:66px;margin-top:40px">${esc(r)}</div></div></div>`).join("")}
      ${endCard(fin)}`;
    return { html, dur: fin + 4.5, title: `${c.title} #retrograde #zodiac #shorts`, lines: c.rules.map((r, i) => `${sn(i)}: ${r}`) };
  }

  // ---------------------------------------------------------------------------------------------- tonight's real sky
  function skyNow() {
    const w = sky.weather(0, date, 21), k = w.illum, r = 230, rx = r * Math.abs(1 - 2 * k), big = k > 0.5;
    const lit = k < 0.01 ? "" : `<path d="M0 ${-r} A${r} ${r} 0 0 1 0 ${r} A${rx} ${r} 0 0 ${big ? 1 : 0} 0 ${-r}" fill="url(#lit)" ${w.waxing ? "" : 'transform="scale(-1 1)"'}/>`;
    const moonSign = sn(w.signOf[1]), phase = sky.item(lang, "moon", w.phase), pct = Math.round(k * 100);
    const retros = sky.BODIES.map((b, i) => (w.retro[i] ? sky.t(lang, `pl.${b}`) : null)).filter(Boolean);
    const stars = Array.from({ length: 90 }, (_, i) => { const h = sky.hash(day, i, 5); return `<i style="left:${h % 1080}px;top:${(h >>> 11) % 1920}px;opacity:${0.25 + ((h >>> 3) % 60) / 100};width:${2 + (h % 3)}px;height:${2 + (h % 3)}px"></i>`; }).join("");
    const html = `<style>.st i{position:absolute;border-radius:50%;background:#fff}</style><div class="st">${stars}</div>
      <div style="position:absolute;top:150px;left:0;right:0;text-align:center"${at(0.1)}><div class="cap" style="color:#9FB4FF">${Wd.tonight} · ${dateText}</div></div>
      <svg width="560" height="560" viewBox="-280 -280 560 560" style="position:absolute;top:260px;left:${(W - 560) / 2}px"${at(0.3, null, "zoom", .8)}>
        <defs><radialGradient id="lit" cx="40%" cy="35%" r="75%"><stop offset="0" stop-color="#FFFDF4"/><stop offset="1" stop-color="#D9D3C2"/></radialGradient>
        <radialGradient id="glow"><stop offset=".6" stop-color="rgba(255,250,230,.18)"/><stop offset="1" stop-color="rgba(255,250,230,0)"/></radialGradient></defs>
        <circle r="278" fill="url(#glow)"/><circle r="${r}" fill="#1B1E2B"/>${lit}</svg>
      <div style="position:absolute;top:880px;left:80px;right:80px;text-align:center;color:#EEF1FF">
        <div class="h" style="font-size:88px"${at(1.4)}>${phase}</div>
        <div style="font-family:BodyB;font-size:46px;margin-top:22px;color:#9FB4FF"${at(2.2)}>${fill(sky.t(lang, "astro.moonin"), moonSign)} · ${pct}% ${Wd.lit}</div>
        ${retros.length ? `<div style="font-family:Body;font-size:40px;margin-top:46px;color:#C9D2F5"${at(3.6)}>${Wd.retroNow}<br><b style="font-family:BodyB;color:#FFD27A">${retros.join(", ")}</b></div>` : ""}
      </div>
      <div style="position:absolute;top:1360px;left:80px;right:80px;text-align:center;color:#EEF1FF">
        <div class="cap" style="color:#9FB4FF"${at(6.5)}>${Wd.means}</div>
        <div class="i" style="font-size:48px;margin-top:22px"${at(7)}>${esc(sky.item(lang, "astro.moonsign", w.signOf[1]))}</div>
        <div class="i" style="font-size:48px;margin-top:26px;color:#FFD27A"${at(10)}>${esc(sky.item(lang, "moon.tip", w.phase))}</div></div>
      ${endCard(15)}`;
    const title = Wd.skyTitle(phase.toLowerCase(), moonSign);
    return { html, dur: 19.5, bg: "#05060C", title: `${title} #moon #astrology #shorts`, lines: [`${phase} · ${moonSign} · ${pct}%`, retros.length ? `${Wd.retroNow} ${retros.join(", ")}` : "", sky.item(lang, "astro.moonsign", w.signOf[1])].filter(Boolean) };
  }

  // ---------------------------------------------------------------------------------------------- ranking board
  function rank(ep) {
    const key = ep === 2 ? "love" : "all", list = totals.map((x) => ({ i: x.i, v: key === "love" ? x.w.love : x.all })).sort((a, b) => a.v - b.v || b.i - a.i);
    const head = ep === 2 ? Wd.rankLove : Wd.rank, t0 = 1.6, step = 1.05, rowH = 104, top = 400, last = t0 + 11 * step + 1.2;
    const rows = list.map((x, k) => { const pos = 12 - k, y = top + (pos - 1) * rowH, a = pos === 1 ? last : t0 + k * step;
      return `<div${at(a, null, pos === 1 ? "pop" : "left", .3)} style="position:absolute;top:${y}px;left:50px;right:50px;height:${rowH - 12}px;display:flex;align-items:center;gap:22px;background:${pos === 1 ? "#111" : "rgba(0,0,0,.07)"};color:${pos === 1 ? "#FFE14D" : "#111"};border-radius:22px;padding:0 26px">
        <b style="font-family:BodyB;font-size:46px;width:90px">#${pos}</b><img src="${signImg(x.i)}" style="width:72px;height:72px;border-radius:50%">
        <span style="font-family:BodyB;font-size:48px;flex:1">${sn(x.i)}</span><b style="font-family:BodyB;font-size:46px">${x.v}%</b></div>`; });
    const html = `<div style="position:absolute;top:120px;left:60px;right:60px;text-align:center;color:#111"><div style="font-family:BodyB;font-size:70px;line-height:1.1"${at(0.1, null, "pop")}>${head}</div>
        <div style="font-family:Body;font-size:34px;margin-top:16px"${at(0.5)}>${dateText}</div></div>${rows.join("")}
      <div style="position:absolute;top:1690px;left:0;right:0;text-align:center;font-family:BodyB;font-size:38px;color:#111"${at(last + 1.2, null, "up")}>${Wd.rankAsk}</div>
      ${endCard(last + 4.6)}`;
    return { html, dur: last + 9, bg: "#FFE14D", title: `${head.toLowerCase()} · ${dateText} #zodiac #horoscope #shorts`, lines: list.slice().reverse().map((x, k) => `#${k + 1} ${sn(x.i)} ${x.v}%`) };
  }

  // ---------------------------------------------------------------------------------------------- yes or no
  function yesno(ep) {
    const h = sky.hash(day, 404, ep), n = h % 78, rev = ((h >>> 9) % 3) === 0, k = tc(n);
    const NO = [13, 15, 16, 40, 52, 54, 58, 59, 68], WAIT = [2, 12, 18, 42, 51, 70];   // Death, Devil, Tower, 5 Cups, 3/5/9/10 Swords, 5 Pentacles | Priestess, Hanged Man, Moon, 7 Cups, 2 Swords, 7 Pentacles
    const v = rev || NO.includes(n) ? "no" : WAIT.includes(n) ? "maybe" : "yes", col = { yes: "#5FD08D", no: "#FF6B6B", maybe: "#F6C766" }[v];
    const html = `<div style="position:absolute;top:620px;left:80px;right:80px;text-align:center">
        <div class="h" style="font-size:88px"${at(0, 5.2, "none", .2)}>${typed(0.2, Wd.think, 22)}</div>
        <div class="i" style="font-size:60px;margin-top:40px;color:#F6C766"${at(3.0, 5.2)}>${Wd.hold}</div></div>
      ${[3, 2, 1].map((x, i) => `<div style="position:absolute;top:720px;left:0;right:0;text-align:center;font-family:Display;font-size:300px;color:#F6C766"${at(5.4 + i, 6.3 + i, "pop", .2)}>${x}</div>`).join("")}
      <div style="position:absolute;top:150px;left:${(W - 440) / 2}px"${at(8.4, null, "none")}>${card(n, cardImg(n), 440, 730, 8.6, rev)}</div>
      <div style="position:absolute;top:930px;left:0;right:0;text-align:center"><div style="font-family:BodyB;font-size:200px;color:${col};letter-spacing:.04em"${at(9.8, null, "pop")}>${Wd[v]}</div></div>
      <div style="position:absolute;top:1210px;left:80px;right:80px;text-align:center"><div class="h" style="font-size:64px"${at(11)}>${k.name}${rev ? ` <span style="font-size:40px;color:#F6C766">(${ctx.HORO.reversed})</span>` : ""}</div>
        <div class="i" style="font-size:50px;margin-top:26px"${at(11.6)}>${esc(rev ? k.rev : k.up)}</div></div>
      ${endCard(17.5)}`;
    return { html, dur: 22, title: `${Wd.yesnoTitle} #tarot #yesorno #shorts`, lines: [`${Wd[v]} · ${k.name}${rev ? ` (${ctx.HORO.reversed})` : ""}`] };
  }

  // ---------------------------------------------------------------------------------------------- birth month grid
  function month() {
    const picks = []; let s = 0; while (picks.length < 12) { const h = sky.hash(day, 1212, s++), n = h % 78; if (!picks.includes(n)) picks.push(n); }
    const cw = 200, ch = 330, gx = (W - 4 * 245) / 2 + 22;
    const cells = picks.map((n, i) => { const x = gx + (i % 4) * 245, y = 380 + Math.floor(i / 4) * 450, a = 1.6 + i * 0.6;
      return `<div style="position:absolute;left:${x}px;top:${y}px;width:${cw}px;text-align:center">
        <div${at(a - 0.3, null, "none", .2)}>${card(n, cardImg(n), cw, ch, a)}</div>
        <div style="font-family:BodyB;font-size:34px;color:#F6C766;margin-top:14px">${sky.item(lang, "month", i)}</div>
        <div style="font-family:Body;font-size:26px;color:#E7DFF7;margin-top:4px;line-height:1.15"${at(a + 0.6)}>${tc(n).name}</div></div>`; });
    const html = `<div style="position:absolute;top:120px;left:60px;right:60px;text-align:center"><div class="h" style="font-size:84px"${at(0.1, null, "pop")}>${Wd.month}</div>
        <div style="font-family:BodyB;font-size:40px;margin-top:20px;color:#F6C766"${at(0.6)}>${Wd.monthSub}</div></div>${cells.join("")}
      ${endCard(17)}`;
    return { html, dur: 21.5, title: `${Wd.month.toLowerCase()} · ${Wd.findMonth} #tarot #pickacard #shorts`, lines: picks.map((n, i) => `${sky.item(lang, "month", i)}: ${tc(n).name}`) };
  }

  // ---------------------------------------------------------------------------------------------- "if this found you"
  function foryou() {
    const h = sky.hash(day, 111), n = h % 78, k = tc(n), wish = date.m === 11 && date.d === 11;
    const html = `${wish ? `<div style="position:absolute;top:160px;left:0;right:0;text-align:center" class="cap"${at(0.1)}>${Wd.wish}</div>` : ""}
      <div style="position:absolute;top:620px;left:90px;right:90px;text-align:center">
        <div class="i" style="font-size:80px"${at(0, 5.6, "none", .2)}>${typed(0.3, Wd.forYou, 20)}</div>
        <div class="i" style="font-size:80px;margin-top:20px;color:#F6C766"${at(2.4, 5.6, "none", .2)}>${typed(2.4, Wd.forYou2, 18)}</div></div>
      <div style="position:absolute;top:200px;left:0;right:0;text-align:center" class="cap"${at(5.8)}>${Wd.msg}</div>
      <div style="position:absolute;top:280px;left:${(W - 440) / 2}px"${at(6.2, null, "none")}>${card(n, cardImg(n), 440, 730, 6.6)}</div>
      <div style="position:absolute;top:1080px;left:90px;right:90px;text-align:center"><div class="h" style="font-size:66px"${at(7.8)}>${k.name}</div>
        <div class="i" style="font-size:56px;margin-top:34px"${at(8.8)}>${esc(k.advice)}</div>
        <div style="font-family:Body;font-size:40px;margin-top:34px;color:#CFC5EA;line-height:1.3"${at(11)}>${esc(k.up)}</div></div>
      ${endCard(16.5)}`;
    const title = wish ? Wd.wishTitle : Wd.forYouTitle;
    return { html, dur: 21, bg: "radial-gradient(circle at 50% 30%, #2A1B55, #0B0718 70%)", title: `${title} ✨ #tarot #shorts`, lines: [k.name, k.advice] };
  }

  // ---------------------------------------------------------------------------------------------- best / worst match per sign
  function compat(ep) {
    const per = 1.85, t0 = 2.2, fin = t0 + 12 * per + 0.6;
    const pairs = sky.SIGNS.map((_, a) => { let best = -1, v = ep === 2 ? 999 : -1;
      for (let b = 0; b < 12; b++) { if (b === a) continue; const c = sky.compatibility(Math.min(a, b), Math.max(a, b)); if (ep === 2 ? c < v : c > v) { v = c; best = b; } } return { a, b: best, v }; });
    const head = ep === 2 ? Wd.worst : Wd.best;
    const html = `<div style="position:absolute;top:120px;left:60px;right:60px;text-align:center;color:#2B1A3D"><div class="h" style="font-size:76px"${at(0.1, null, "pop")}>${head}</div></div>
      ${pairs.map((p, i) => { const s = t0 + i * per, k = sky.pairKey(p.a, p.b);
        return `<div class="layer"${at(s, s + per, "none", .2)}>
          <div style="position:absolute;top:470px;left:0;right:0;display:flex;justify-content:center;align-items:center;gap:40px">
            <img src="${signImg(p.a)}" style="width:300px;height:300px;border-radius:50%;border:5px solid #2B1A3D"><span style="font-size:90px;color:#E2466B">${ep === 2 ? "⚡" : "♥"}</span>
            <img src="${signImg(p.b)}" style="width:300px;height:300px;border-radius:50%;border:5px solid #2B1A3D"></div>
          <div style="position:absolute;top:840px;left:60px;right:60px;text-align:center;color:#2B1A3D"><div class="h" style="font-size:84px">${sn(p.a)} + ${sn(p.b)}</div>
            <div style="font-family:BodyB;font-size:120px;color:#E2466B;margin-top:20px"><span data-count="${s + .2}" data-to="${p.v}" data-dur=".9" data-suf="%"></span></div>
            <div class="i" style="font-size:50px;margin-top:20px">${esc(sky.t(lang, `compat.${k}.sum`))}</div></div></div>`; }).join("")}
      ${endCard(fin)}`;
    return { html, dur: fin + 4.5, bg: "#FFF1EA", title: `${head.toLowerCase()} ${ep === 2 ? "⚡" : "💞"} #zodiac #compatibility #shorts`, lines: pairs.map((p) => `${sn(p.a)} + ${sn(p.b)}: ${p.v}%`) };
  }

  // ---------------------------------------------------------------------------------------------- pick your element
  function element() {
    const E = [["fire", "#FF6B3D", "🔥"], ["earth", "#5E8F4C", "🌿"], ["air", "#7FB8F0", "💨"], ["water", "#2F5FC4", "🌊"]];
    const info = E.map(([e], j) => { const signs = [0, 1, 2].map((q) => j + q * 4), v = Math.round(signs.reduce((s, i) => s + totals[i].all, 0) / 3);
      const w = totals[signs[0]].w, best = [["love", w.love], ["career", w.career], ["money", w.money], ["energy", w.energy]].sort((a, b) => b[1] - a[1])[0][0];
      return { v, best, signs, adv: sky.daily(lang, signs[0], date).advice }; });
    const t0 = 4.4, per = 3.6, fin = t0 + 4 * per;
    const html = `<div style="position:absolute;top:150px;left:60px;right:60px;text-align:center"><div class="h" style="font-size:96px"${at(0.1, t0)}>${Wd.element}</div>
        <div style="font-family:BodyB;font-size:42px;margin-top:20px;color:#F6C766"${at(1.2, t0)}>${Wd.pause}</div></div>
      ${E.map(([e, c, em], j) => `<div${at(0.4 + j * .25, t0, "pop")} style="position:absolute;left:${70 + (j % 2) * 480}px;top:${560 + Math.floor(j / 2) * 520}px;width:460px;height:480px;border-radius:40px;background:${c};display:grid;place-items:center;text-align:center">
        <div><div style="font-size:130px">${em}</div><div class="h" style="font-size:70px">${Wd.elements[e]}</div></div></div>`).join("")}
      ${E.map(([e, c, em], j) => `<div class="layer"${at(t0 + j * per, t0 + (j + 1) * per, "none", .25)} style="background:${c}">
        <div style="position:absolute;top:330px;left:0;right:0;text-align:center;font-size:200px">${em}</div>
        <div style="position:absolute;top:620px;left:80px;right:80px;text-align:center"><div class="h" style="font-size:120px">${Wd.elements[e]}</div>
          <div style="font-family:BodyB;font-size:40px;margin-top:10px">${info[j].signs.map(sn).join(" · ")}</div>
          <div style="font-family:BodyB;font-size:160px;margin-top:40px"><span data-count="${t0 + j * per + .3}" data-to="${info[j].v}" data-suf="%"></span></div>
          <div style="font-family:BodyB;font-size:44px">${V.strongest}: ${sky.t(lang, "home." + info[j].best)}</div>
          <div class="i" style="font-size:54px;margin-top:40px">${esc(info[j].adv)}</div></div></div>`).join("")}
      ${endCard(fin)}`;
    return { html, dur: fin + 4.5, title: `${Wd.elementTitle} #zodiac #astrology #shorts`, lines: E.map(([e], j) => `${Wd.elements[e]}: ${info[j].v}% · ${info[j].adv}`) };
  }

  // ---------------------------------------------------------------------------------------------- lucky quick-fire
  function lucky() {
    const per = 1.3, t0 = 2, fin = t0 + 12 * per + 0.4;
    const L = sky.SIGNS.map((_, i) => sky.daily(lang, i, date));
    const dark = (hex) => { const n = parseInt(hex.slice(1), 16); return ((n >> 16) * .3 + ((n >> 8) & 255) * .59 + (n & 255) * .11) > 150; };
    const html = `<div style="position:absolute;top:700px;left:70px;right:70px;text-align:center"${at(0.1, t0, "pop")}><div class="h" style="font-size:100px">${Wd.lucky}</div><div class="cap" style="margin-top:30px">${dateText}</div></div>
      ${L.map((d, i) => { const c = HEX[d.luckyColorIndex] || "#888", ink = dark(c) ? "#151020" : "#FFF7EC";
        return `<div class="layer"${at(t0 + i * per, t0 + (i + 1) * per, "none", .12)} style="background:${c};color:${ink}">
          <img src="${signImg(i)}" style="position:absolute;top:300px;left:${(W - 300) / 2}px;width:300px;height:300px;border-radius:50%;border:6px solid ${ink}">
          <div style="position:absolute;top:660px;left:60px;right:60px;text-align:center"><div class="h" style="font-size:110px">${sn(i)}</div>
          <div style="font-family:BodyB;font-size:300px;line-height:1;margin-top:40px">${d.luckyNumber}</div>
          <div style="font-family:BodyB;font-size:56px;margin-top:30px;letter-spacing:.08em;text-transform:uppercase">${d.luckyColor}</div></div></div>`; }).join("")}
      ${endCard(fin)}`;
    return { html, dur: fin + 4.5, title: `${Wd.lucky.toLowerCase()} 🍀 #zodiac #luckynumber #shorts`, lines: L.map((d, i) => `${sn(i)}: ${d.luckyNumber} · ${d.luckyColor}`) };
  }

  // ---------------------------------------------------------------------------------------------- POV spotlight with the "why"
  function pov(ep) {
    const sorted = totals.slice().sort((a, b) => b.all - a.all), x = ep === 2 ? sorted[11] : sorted[0], w = x.w, name = sn(x.i);
    const M = [["love", w.love, w.loveWhy], ["career", w.career, w.careerWhy], ["money", w.money, w.moneyWhy], ["energy", w.energy, w.energyWhy]];
    const top = M.slice().sort((a, b) => (ep === 2 ? a[1] - b[1] : b[1] - a[1]))[0];
    const head = Wd.povHead(name);
    const html = `<img src="${signImg(x.i)}" style="position:absolute;top:200px;left:${(W - 380) / 2}px;width:380px;height:380px;border-radius:50%;border:5px solid #F6C766"${at(0.1, null, "pop")}>
      <div style="position:absolute;top:640px;left:60px;right:60px;text-align:center"><div class="h" style="font-size:90px"${at(0.4)}>${head}</div></div>
      ${M.map(([k, v, why], j) => `<div style="position:absolute;top:${860 + j * 150}px;left:90px;right:90px"${at(2 + j * .5, null, "left")}>
        <div style="display:flex;justify-content:space-between;font-family:BodyB;font-size:42px"><span>${sky.t(lang, "home." + k)}</span><span>${v}%</span></div>
        <div style="height:22px;border-radius:11px;background:rgba(255,255,255,.15);margin-top:12px"><div data-bar="${2.2 + j * .5}" data-to="${v}" style="height:100%;border-radius:11px;background:${v >= 70 ? "#5FD08D" : v >= 50 ? "#F6C766" : "#FF6B6B"}"></div></div>
        <div style="font-family:Body;font-size:30px;color:#CFC5EA;margin-top:8px">${esc(sky.whyLabel(lang, why))}</div></div>`).join("")}
      <div style="position:absolute;top:1480px;left:80px;right:80px;text-align:center"><div class="cap"${at(6)}>${Wd.why} · ${sky.t(lang, "home." + top[0])}</div>
        <div class="i" style="font-size:50px;margin-top:20px"${at(6.4)}>${esc(sky.skyLine(lang, top[2]))}</div></div>
      ${endCard(13.5)}`;
    return { html, dur: 18, title: `${head.toLowerCase()} ${ep === 2 ? "😮‍💨" : "✨"} #${sky.SIGNS[x.i]} #horoscope #shorts`, lines: M.map(([k, v, why]) => `${sky.t(lang, "home." + k)} ${v}% · ${sky.whyLabel(lang, why)}`) };
  }

  return { chat, notes, myth, retro, sky: skyNow, rank, yesno, month, foryou, compat, element, lucky, pov };
}
