# Week 1 (2026-11-22 .. 11-28): 14 hand-written posts, rendered locally with v3, no paid API.
# Days 1-2 reuse the approved samples (v2/samples). Writes <date>_<n>.json next to this file.
import json, os, shutil
HERE = os.path.dirname(os.path.abspath(__file__))
SAMPLES = os.path.join(HERE, "..", "..", "v2", "samples")

MOON = ["moon/NHQ202110190008.jpg", "moon/MAF_20210525_NOLAMoonrise1.jpg", "moon/MAF_20210822_MoonOverNOLA.jpg",
        "moon/NHQ202501130002.jpg", "moon/NHQ202110190011.jpg"]
V = 5  # virgo
mars_signs = [
    ("work & daily routine", "your to-do list finally gets attacked. great week to fix one habit you keep putting off."),
    ("romance & fun", "you get bolder about what you want. flirt first, make the thing, stop waiting to be asked."),
    ("home & family", "energy goes into your space: moving furniture, a family talk, setting a boundary at home."),
    ("messages & quick plans", "you say what you mean, fast. send the message, but read it once before you hit send."),
    ("money & self-worth", "you get serious about money. ask for the rate you deserve, cancel what you don't use."),
    ("you", "mars in your sign: more drive, less patience. start the big thing, just don't pick every fight."),
    ("rest & the unseen", "quieter energy for you. work behind the scenes and protect your sleep."),
    ("friends & big goals", "group projects heat up. you'll see who actually pulls their weight."),
    ("career & reputation", "ambition switches on. people notice what you're doing, so do it on purpose."),
    ("study, travel & beliefs", "you're restless for something new: a course, a trip, a big idea. pick one and commit."),
    ("intimacy & shared money", "intense feelings and honest money talks. deal with the thing you keep avoiding."),
    ("partners", "relationships get direct. someone pushes you, or you finally push back. both can be healthy."),
]

posts = {
 "2026-11-22_1": ("sample", "d1_pick", '"pick a pile": what they\'re not saying (relationship)'),
 "2026-11-22_2": ("sample", "d1_sky", "full moon in gemini (nov 24): post it today or tomorrow, not later"),
 "2026-11-23_1": ("sample", "d2_pick", '"pick a card": what december brings'),
 "2026-11-23_2": ("sample", "d2_series", "78-card series, part 1: the fool"),

 "2026-11-24_1": ({
  "format": "pick", "tex": "cherry", "seed": 41, "light": [880, 240],
  "hook": "full moon tonight.<br>pick a pile: what you're finally ready to let go of",
  "piles": [
   {"title": "someone you keep checking on", "cards": [43, 59, 17],
    "text": "you already know how this ends. stop refreshing their page. the peace you want starts the day you stop looking."},
   {"title": "the version of you that had to be tough", "cards": [30, 8, 41],
    "text": "you got through it. you don't have to keep your guard up in every room now. soft isn't weak."},
   {"title": "a worry that isn't yours to carry", "cards": [68, 69, 21],
    "text": "you've been carrying someone else's problem like it's your job. hand it back. something finishes for you this week."}
  ],
  "outro": "which pile<br>was yours?",
  "cta": "comment 1, 2 or 3<br>and what you're letting go 🌕",
  "caption": "full moon tonight 🌕 pick a pile: what you're ready to let go of #fullmoon #pickapile #tarot #tarotreading #fullmoonritual"
 }, None, "full moon day: pick a pile, letting go"),

 "2026-11-24_2": ({
  "format": "series", "card": 1, "part": 2, "seed": 22,
  "lead": "part 2. the card that says you already have the tools.",
  "revNote": "reversed, it can mean a talent you're not using yet, or someone who's all talk.",
  "next": "the high priestess: the card for when your gut already knows. follow so you don't miss it.",
  "yn": ["upright: yes", "reversed: not yet"],
  "caption": "the magician tarot card meaning: upright, reversed, love and yes or no ✨ part 2 of 78 #tarot #themagician #tarotmeaning #learntarot #tarotcards"
 }, None, "78-card series, part 2: the magician"),

 "2026-11-25_1": ({
  "format": "sky", "kicker": "wednesday · nov 25 · 23:40 utc", "hookTop": 940,
  "hook": "mars moves into virgo tonight. here's where it lights a fire for your sign",
  "wheelNote": "real position: mars enters virgo at 23:40 utc. it stays until feb 21, then comes back in may, so this is a long chapter",
  "photos": [{"photo": "moon/GSFC_20171208_Archive_e000332.jpg", "contain": True, "cw": 760, "cy": 470}] +
            [{"photo": MOON[i % 4], "dim": 0.45} for i in range(4)] + [{"photo": MOON[4], "dim": 0.5, "blur": 3}],
  "signs": [{"sign": s, "house": f"your {['1st','2nd','3rd','4th','5th','6th','7th','8th','9th','10th','11th','12th'][(V - s) % 12]} house · {t}", "text": x}
            for s, (t, x) in enumerate(mars_signs)],
  "outro": "save this<br>for tonight 🔥",
  "cta": "this is for your sun sign. read your rising too: it often fits even better.<br>comment your sun + rising 👇",
  "caption": "mars enters virgo tonight: what it means for your sign 🔥 #astrology #marsinvirgo #horoscope #zodiacsigns #astrologytiktok"
 }, None, "mars enters virgo tonight (real time 23:40 utc): post it today"),

 "2026-11-25_2": ({
  "format": "rank", "tex": "jacquard", "seed": 52, "cards": [43, 30],
  "hook": "zodiac signs ranked by how fast they move on",
  "sub": "#1 is barely human",
  "items": [
   {"sign": 3, "text": "still has the voice notes. all of them."},
   {"sign": 7, "text": "says they're over it. checks the profile at 2am."},
   {"sign": 1, "text": "needs months. and a new haircut."},
   {"sign": 11, "text": "writes a whole album about it in their head."},
   {"sign": 5, "text": "moves on only after a full report on what went wrong."},
   {"sign": 6, "text": "moves on fast but insists you stay 'friends'."},
   {"sign": 4, "text": "moves on the second someone else gives them attention."},
   {"sign": 9, "text": "puts it in a box and works 60 hours a week."},
   {"sign": 0, "text": "furious for three days, then completely done."},
   {"sign": 2, "text": "already talking to two new people. both funny."},
   {"sign": 10, "text": "detached before it even ended."},
   {"sign": 8, "text": "booked a flight. gone."}
  ],
  "outro": "where did<br>yours land?",
  "cta": "comment your sign 👇<br>(your moon sign explains even more)",
  "caption": "zodiac signs ranked by how fast they move on 💔 where's yours? #zodiacsigns #astrology #zodiac #astrologymemes #breakup"
 }, None, "zodiac ranking: how fast they move on"),

 "2026-11-26_1": ({
  "format": "pick", "single": True, "tex": "floor", "seed": 61, "light": [200, 300],
  "hook": "think of a yes or no question.<br>now pick a card",
  "sub": "first instinct only",
  "piles": [
   {"title": "yes, a clear one", "cards": [19],
    "text": "the sun is as close to a yes as tarot gets. go ahead, and stop asking everyone else for permission."},
   {"title": "not yet", "cards": [12],
    "text": "the hanged man says wait. the answer isn't no, the timing just isn't here. look at it from another angle first."},
   {"title": "no, and it's protecting you", "cards": [16],
    "text": "the tower says this one would fall apart. it stings now, but it clears space for something that actually holds."}
  ],
  "outro": "which card<br>did you get?",
  "cta": "comment 1, 2 or 3<br>and your question if you're brave",
  "caption": "yes or no tarot: think of a question and pick a card 🃏 #tarot #yesornotarot #pickacard #tarotreading #tarottok"
 }, None, '"yes or no": pick a card'),

 "2026-11-26_2": ({
  "format": "series", "card": 2, "part": 3, "seed": 23, "tex": "wood",
  "lead": "part 3. the quiet card that knows more than it says.",
  "revNote": "reversed, it often means you're ignoring your gut, or a secret is close to coming out.",
  "next": "the empress: comfort, abundance and being looked after. follow so you don't miss it.",
  "yn": ["upright: yes, if your gut agrees", "reversed: wait"],
  "caption": "the high priestess tarot card meaning: upright, reversed, love and yes or no 🌙 part 3 of 78 #tarot #thehighpriestess #tarotmeaning #learntarot #tarotcards"
 }, None, "78-card series, part 3: the high priestess"),

 "2026-11-27_1": ({
  "format": "pick", "tex": "quatrefoil", "seed": 71, "light": [180, 260],
  "hook": "pick a pile.<br>what's coming in your love life before the year ends",
  "piles": [
   {"title": "someone from the past checks in", "cards": [41, 10, 46],
    "text": "an old name shows up: a message, a like, a 'saw this and thought of you'. you get to decide if it's a reunion or just closure."},
   {"title": "a slow burn finally becomes obvious", "cards": [6, 24, 72],
    "text": "the person you've been reading signals from stops being subtle. expect a clear move before new year."},
   {"title": "you choose yourself, and it attracts the right one", "cards": [3, 44, 77],
    "text": "you stop shrinking to fit. that confidence is exactly what draws in someone steady. no chasing this time."}
  ],
  "outro": "which pile<br>was yours?",
  "cta": "comment 1, 2 or 3<br>and come back in january to tell me",
  "caption": "pick a pile: what's coming in your love life before the year ends 💌 #tarot #pickapile #lovereading #tarotreading #tarottok"
 }, None, '"pick a pile": love before the year ends'),

 "2026-11-27_2": ({
  "format": "rank", "tex": "rosewood", "seed": 82, "cards": [6, 46],
  "hook": "zodiac signs ranked by how obvious they are when they like you",
  "sub": "#12 will take it to the grave",
  "items": [
   {"sign": 9, "text": "you'll find out at the wedding."},
   {"sign": 7, "text": "stares. says nothing. remembers everything you've ever said."},
   {"sign": 10, "text": "sends a meme about black holes at 3am. that was the confession."},
   {"sign": 5, "text": "quietly fixes your problems and calls it 'nothing'."},
   {"sign": 3, "text": "feeds you. constantly."},
   {"sign": 1, "text": "shows up every single time. with snacks."},
   {"sign": 11, "text": "has already named your future cat."},
   {"sign": 2, "text": "texts you 40 times, then vanishes for a day."},
   {"sign": 6, "text": "compliments you to everyone except you."},
   {"sign": 8, "text": "invites you on a random trip on day two."},
   {"sign": 0, "text": "tells you directly. on day one."},
   {"sign": 4, "text": "has told the group chat, their mom and the barista."}
  ],
  "outro": "where did<br>yours land?",
  "cta": "comment your sign 👇<br>(check your venus sign too)",
  "caption": "zodiac signs ranked by how obvious they are when they like you 😳 #zodiacsigns #astrology #zodiac #astrologymemes #crush"
 }, None, "zodiac ranking: how obvious they are when they like you"),

 "2026-11-28_1": ({
  "format": "pick", "single": True, "tex": "fleece", "seed": 91, "light": [880, 260],
  "hook": "pick a card.<br>your message for this weekend",
  "sub": "trust the first one your eyes went to",
  "piles": [
   {"title": "slow down, you're allowed", "cards": [14],
    "text": "temperance says the week was a lot. don't fill every hour. a slow saturday puts you back together."},
   {"title": "say yes to the plans", "cards": [25],
    "text": "four of wands: celebration. the invite you almost turned down is the one. go, even for an hour."},
   {"title": "quiet time fixes more than you think", "cards": [9],
    "text": "the hermit wants you offline for a bit. a walk, a book, no phone. the answer you're chasing shows up in the quiet."}
  ],
  "outro": "which card<br>did you pick?",
  "cta": "comment 1, 2 or 3<br>and how your weekend went",
  "caption": "pick a card: your message for this weekend ✨ #tarot #pickacard #tarotreading #weekendvibes #tarottok"
 }, None, '"pick a card": your weekend message'),

 "2026-11-28_2": ({
  "format": "series", "card": 3, "part": 4, "seed": 24, "tex": "jacquard",
  "lead": "part 4. the card of abundance, comfort and care.",
  "revNote": "reversed, it can mean giving so much to others that you forget yourself.",
  "next": "the emperor: structure, boundaries and the card people misread most. follow so you don't miss it.",
  "yn": ["upright: yes", "reversed: not yet"],
  "caption": "the empress tarot card meaning: upright, reversed, love and yes or no 🌿 part 4 of 78 #tarot #theempress #tarotmeaning #learntarot #tarotcards"
 }, None, "78-card series, part 4: the empress"),
}

# labels go to the owner on Telegram, so they are in Turkish
TR = {
 "2026-11-22_1": '"Deste seç": söylemedikleri (ilişki)',
 "2026-11-22_2": "Dolunay İkizler'de (24 Kasım): bugün ya da yarın paylaş, daha geç değil",
 "2026-11-23_1": '"Kart seç": aralık ne getiriyor',
 "2026-11-23_2": "78 kart serisi, bölüm 1: Deli",
 "2026-11-24_1": "Dolunay günü: deste seç, bırakmaya hazır olduğun şey",
 "2026-11-24_2": "78 kart serisi, bölüm 2: Büyücü",
 "2026-11-25_1": "Mars bu gece Başak'a geçiyor (gerçek saat 23:40 UTC): bugün paylaş",
 "2026-11-25_2": "Burç sıralaması: kim ne kadar çabuk unutur",
 "2026-11-26_1": '"Evet mi hayır mı": kart seç',
 "2026-11-26_2": "78 kart serisi, bölüm 3: Azize",
 "2026-11-27_1": '"Deste seç": yıl bitmeden aşk hayatında ne var',
 "2026-11-27_2": "Burç sıralaması: hoşlandığında ne kadar belli eder",
 "2026-11-28_1": '"Kart seç": hafta sonu mesajın',
 "2026-11-28_2": "78 kart serisi, bölüm 4: İmparatoriçe",
}
posts = {k: (v[0], v[1], TR[k]) for k, v in posts.items()}

for key, (spec, sample, label) in posts.items():
    out = os.path.join(HERE, key + ".json")
    if spec == "sample":
        shutil.copy(os.path.join(SAMPLES, sample + ".json"), out)
    else:
        json.dump(spec, open(out, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    open(os.path.join(HERE, key + ".label"), "w", encoding="utf-8").write(label + "\n")
print(len(posts), "specs")
