// Hand-written lines for the concept videos that are not pure engine output (group chat, notes, myth hooks, retrograde rules).
// Sign order everywhere: aries taurus gemini cancer leo virgo libra scorpio sagittarius capricorn aquarius pisces (0..11).
// en and tr here, pt/es/id/vi in content_i18n.mjs; a missing language falls back to en through pickLang.

export const CONTENT = {
  en: {
    chat1: {
      title: "the signs in the group chat during mercury retrograde",
      group: "zodiac gc 🪐",
      msgs: [[2, "guys mercury is retrograde"], [0, "so?"], [2, "so I just texted my ex \"wrong chat\" 3 times"], [5, "I made a spreadsheet of everything that will go wrong"],
        [4, "my phone died mid-selfie. this is an attack"], [3, "rereading messages from 2019 for no reason"], [7, "I knew this would happen. I always know."],
        [8, "booked a flight. missed the flight. booked another"], [9, "emails sent: 0. emails rewritten: 14"], [6, "can't decide if I should be stressed"],
        [11, "I've been retrograde my whole life"], [10, "retrograde is a social construct"], [1, "wake me up when it's over 😴"]],
      outro: "Mercury really is retrograde right now. Sussa shows where it hits your chart.",
    },
    chat2: {
      title: "the signs when someone says \"we need to talk\"",
      group: "zodiac gc 🪐",
      msgs: [[6, "\"we need to talk\""], [0, "about WHAT"], [1, "is there food at this talk"], [2, "screenshots already sent to 3 friends"], [3, "crying in advance"],
        [4, "is this about how great I am"], [5, "I prepared a list of my mistakes, sorted by date"], [6, "I agree with whatever you're about to say"],
        [7, "I already know. I've known for weeks."], [8, "left on read. went hiking"], [9, "can we schedule it for Thursday 3:15"],
        [10, "define \"talk\""], [11, "I wrote a poem about this moment"]],
      outro: "Your sign is only the start. Sussa reads your whole chart, every morning.",
    },
    notes1: { sign: 7, title: "things a scorpio will never say out loud", head: "things a scorpio will never say out loud",
      lines: ["\"I already forgave you\"", "\"I only checked your profile once\"", "\"I'm not jealous\"", "\"that didn't hurt\"", "\"I don't need anyone\"", "\"I'm fine, just tired\""],
      outro: "It's Scorpio season. Sussa knows what your Moon is up to." },
    notes2: { sign: 4, title: "things a leo will never say out loud", head: "things a leo will never say out loud",
      lines: ["\"you pick the restaurant\"", "\"I don't need the attention\"", "\"maybe this outfit is too much\"", "\"no one has to clap\"", "\"I'm happy in the background\"", "\"anyway, enough about me\""],
      outro: "Leo or not, Sussa shows what today's sky means for you." },
    myth1: { card: 13, title: "the death card doesn't mean what you think 💀", hook: "The Death card doesn't mean what you think", calm: "Nobody is dying.", real: "What it really means" },
    myth2: { card: 16, title: "pulled the tower? don't panic", hook: "Pulled The Tower? Don't panic.", calm: "It isn't a curse.", real: "What it really means" },
    retro1: { title: "mercury retrograde: one rule for each sign", head: "Mercury retrograde", sub: "one rule for each sign",
      rules: ["Count to ten before you reply.", "Back up your phone. Tonight.", "Read the message twice. Send it once.", "Don't text the ex. Text your mom.", "Not every delay is about you.",
        "Let one thing be imperfect.", "Decide anyway. Undecided is a decision.", "Don't test people. Ask them.", "Check the flight time. Then check it again.",
        "Sign nothing in a hurry.", "Old friends will reach out. Answer one.", "Write it down before it slips away."] },
    retro2: { title: "venus is retrograde too: one love rule per sign", head: "Venus retrograde", sub: "one love rule for each sign",
      rules: ["Don't start a fight to feel something.", "Don't buy it just because you're sad.", "Say the thing, not the joke about the thing.", "Old flame calling? Let it ring.",
        "Ask for what you want. Out loud.", "You don't have to fix them.", "Choose yourself once this week.", "Jealousy is information, not instructions.",
        "Stay for one serious conversation.", "Tell them you care. In words.", "Feelings are not a bug.", "Romanticize your own life first."] },
  },
  tr: {
    chat1: {
      title: "merkür retrosunda burçların grup sohbeti",
      group: "burçlar grubu 🪐",
      msgs: [[2, "arkadaşlar merkür retroda"], [0, "eee?"], [2, "eski sevgiliye 3 kere \"yanlış kişi\" yazdım"], [5, "ters gidecek her şeyin tablosunu çıkardım"],
        [4, "selfie çekerken şarjım bitti. bu bir saldırı"], [3, "2019'daki mesajları sebepsiz okuyorum"], [7, "biliyordum. hep bilirim."],
        [8, "uçak bileti aldım. uçağı kaçırdım. yenisini aldım"], [9, "gönderilen mail: 0. baştan yazılan: 14"], [6, "stres yapsam mı karar veremedim"],
        [11, "ben hayatım boyunca retrodayım"], [10, "retro bir sosyal kurgudur"], [1, "bitince uyandırın 😴"]],
      outro: "Merkür şu an gerçekten retroda. Sussa haritanda nereye dokunduğunu gösterir.",
    },
    chat2: {
      title: "biri \"konuşmamız lazım\" deyince burçlar",
      group: "burçlar grubu 🪐",
      msgs: [[6, "\"konuşmamız lazım\""], [0, "NE HAKKINDA"], [1, "bu konuşmada yemek var mı"], [2, "ekran görüntüsü 3 kişiye gitti bile"], [3, "şimdiden ağlıyorum"],
        [4, "ne kadar harika olduğum hakkında mı"], [5, "hatalarımın listesini tarihe göre sıraladım"], [6, "ne diyeceksen katılıyorum"],
        [7, "biliyorum zaten. haftalardır biliyorum."], [8, "görüldü attım. yürüyüşe çıktım"], [9, "perşembe 15:15'e randevu alalım"],
        [10, "\"konuşmak\"ı tanımla"], [11, "bu an hakkında şiir yazdım"]],
      outro: "Burcun sadece başlangıç. Sussa her sabah tüm haritanı okur.",
    },
    notes1: { sign: 7, title: "bir akrep'in asla yüksek sesle söylemeyeceği şeyler", head: "bir akrep'in asla söylemeyeceği şeyler",
      lines: ["\"seni çoktan affettim\"", "\"profiline bir kere baktım\"", "\"kıskanmıyorum\"", "\"canım yanmadı\"", "\"kimseye ihtiyacım yok\"", "\"iyiyim, sadece yorgunum\""],
      outro: "Akrep sezonundayız. Sussa Ay'ının ne yaptığını bilir." },
    notes2: { sign: 4, title: "bir aslan'ın asla yüksek sesle söylemeyeceği şeyler", head: "bir aslan'ın asla söylemeyeceği şeyler",
      lines: ["\"restoranı sen seç\"", "\"ilgiye ihtiyacım yok\"", "\"bu kıyafet fazla mı\"", "\"alkışlamanıza gerek yok\"", "\"arka planda olmak güzel\"", "\"neyse, benden bu kadar\""],
      outro: "Aslan ol ya da olma, Sussa bugünün gökyüzünün sana ne dediğini gösterir." },
    myth1: { card: 13, title: "ölüm kartı düşündüğün anlama gelmiyor 💀", hook: "Ölüm kartı düşündüğün anlama gelmiyor", calm: "Kimse ölmüyor.", real: "Gerçek anlamı" },
    myth2: { card: 16, title: "kule kartı mı çıktı? panik yok", hook: "Kule kartı mı çıktı? Panik yok.", calm: "Bu bir lanet değil.", real: "Gerçek anlamı" },
    retro1: { title: "merkür retrosu: her burca bir kural", head: "Merkür retrosu", sub: "her burca bir kural",
      rules: ["Cevap vermeden önce ona kadar say.", "Telefonunu yedekle. Bu akşam.", "Mesajı iki kez oku, bir kez gönder.", "Eski sevgiliye değil, annene yaz.", "Her gecikme seninle ilgili değil.",
        "Bir şey kusurlu kalsın.", "Yine de karar ver. Kararsızlık da bir karar.", "İnsanları sınama. Sor.", "Uçuş saatini kontrol et. Sonra tekrar et.",
        "Aceleyle hiçbir şey imzalama.", "Eski dostlar yazacak. Birine cevap ver.", "Aklına geleni unutmadan yaz."] },
    retro2: { title: "venüs de retroda: her burca bir aşk kuralı", head: "Venüs retrosu", sub: "her burca bir aşk kuralı",
      rules: ["Bir şey hissetmek için kavga çıkarma.", "Üzgünsün diye alışveriş yapma.", "Şakasını değil, kendisini söyle.", "Eski aşk mı arıyor? Bırak çalsın.",
        "İstediğini yüksek sesle iste.", "Onu düzeltmek zorunda değilsin.", "Bu hafta bir kez kendini seç.", "Kıskançlık bilgi verir, emir vermez.",
        "Bir ciddi konuşmada kal.", "Önemsediğini kelimelerle söyle.", "Duygular hata değil.", "Önce kendi hayatını romantikleştir."] },
  },
};

// UI words of the concept videos
export const WORDS = {
  en: { members: "13 members", typing: "is typing…", notes: "Notes", today: "Today", pause: "Pause and choose", think: "Think of a yes or no question", hold: "Hold it in your mind…",
    yes: "YES", no: "NO", maybe: "NOT YET", month: "Your birth month's card", monthSub: "find your month · screenshot it", forYou: "If this video found you,", forYou2: "it's not random.",
    msg: "Your message for today:", best: "Best match for every sign", worst: "The most chaotic match for every sign", element: "Pick your element", elements: { fire: "Fire", earth: "Earth", air: "Air", water: "Water" },
    lucky: "Your lucky number & color today", number: "number", color: "color", rank: "Luckiest signs today, ranked", rankLove: "Luck in love today, ranked",
    pov: "POV: you're a", povToday: "today", why: "why", tonight: "Tonight's sky", lit: "lit", waxing: "waxing", waning: "waning", retroNow: "Moving backwards right now:",
    means: "What it means for you", in: "in", energy: "energy", wish: "11:11 · make a wish",
    skyTitle: (p, s) => `${p} in ${s} tonight 🌙 what it means for you`, rankAsk: "where did your sign land? 👇", yesnoTitle: "think of a yes or no question… the card answers 🔮",
    findMonth: "find your month", wishTitle: "11:11 · if this found you, the message is yours", forYouTitle: "if this video found you, it's not random",
    elementTitle: "pick your element: fire, earth, air or water", povHead: (n) => `POV: you're ${/^[AEIOU]/.test(n) ? "an" : "a"} ${n} today` },
  tr: { members: "13 üye", typing: "yazıyor…", notes: "Notlar", today: "Bugün", pause: "Durdur ve seç", think: "Evet ya da hayır cevaplı bir soru düşün", hold: "Aklında tut…",
    yes: "EVET", no: "HAYIR", maybe: "HENÜZ DEĞİL", month: "Doğduğun ayın kartı", monthSub: "ayını bul · ekran görüntüsü al", forYou: "Bu video seni bulduysa,", forYou2: "tesadüf değil.",
    msg: "Bugünkü mesajın:", best: "Her burcun en iyi eşleşmesi", worst: "Her burcun en kaotik eşleşmesi", element: "Elementini seç", elements: { fire: "Ateş", earth: "Toprak", air: "Hava", water: "Su" },
    lucky: "Bugün şanslı sayın ve rengin", number: "sayı", color: "renk", rank: "Bugün en şanslı burçlar sıralaması", rankLove: "Bugün aşkta en şanslı burçlar",
    pov: "POV: bugün", povToday: "burcusun", why: "neden", tonight: "Bu geceki gökyüzü", lit: "aydınlık", waxing: "büyüyen", waning: "küçülen", retroNow: "Şu an geri hareket edenler:",
    means: "Sana ne anlatıyor", in: "", energy: "enerji", wish: "11:11 · bir dilek tut",
    skyTitle: (p, s) => `bu gece ${p} · ay ${s} burcunda 🌙 sana ne anlatıyor`, rankAsk: "burcun kaçıncı? 👇", yesnoTitle: "aklındaki sorunun cevabı: evet mi hayır mı? 🔮",
    findMonth: "ayını bul", wishTitle: "11:11 · bu video seni bulduysa, mesaj senin için", forYouTitle: "bu video seni bulduysa tesadüf değil",
    elementTitle: "elementini seç: ateş, toprak, hava, su", povHead: (n) => `POV: bugün ${n} burcusun` },
};
export const pickLang = (obj, lang) => obj[lang] || obj.en;

// pt, es, id, vi live in content_i18n.mjs
import { MORE, MORE_WORDS } from "./content_i18n.mjs";
Object.assign(CONTENT, MORE); Object.assign(WORDS, MORE_WORDS);
