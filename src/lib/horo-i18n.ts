// Page strings for the daily horoscope and compatibility pages. Reading texts come from the app (src/data/horo, lib/sky.ts);
// titles follow how people search in each language ("akrep burcu günlük", "horóscopo de escorpio hoy", "ramalan zodiak").
import type { Lang } from "./tarot-i18n";

export interface HoroUI {
  nav: string; compatNav: string;
  indexTitle: string; indexDesc: string; indexH1: string; indexIntro: string;
  title: (sign: string, date: string) => string;
  tomorrowTitle: (sign: string, date: string) => string;
  desc: (sign: string, date: string, open: string) => string;
  h1: (sign: string) => string; h1Tomorrow: (sign: string) => string;
  today: string; tomorrow: string; yesterdayNote: string;
  skyToday: string; skySub: string; whyLabel: string;
  cardOfDay: string; reversed: string; aboutSign: (sign: string) => string;
  element: string; quality: string; ruler: string; strength: string; watch: string;
  otherSigns: string;
  appTitle: string; appText: string; appBtn: string;
  compatIndexTitle: string; compatIndexDesc: string; compatH1: string; compatIntro: string;
  compatTitle: (a: string, b: string) => string; compatDesc: (a: string, b: string, n: number) => string;
  friendship: string; work: string; pickPair: string;
  tz: string; locale: string;
}

export const HORO_UI: Record<Lang, HoroUI> = {
  en: {
    nav: "Horoscope", compatNav: "Compatibility",
    indexTitle: "Daily Horoscope for All 12 Signs Today | Sussa", indexDesc: "Free daily horoscope for every zodiac sign, built from where the planets really are today: love, career, money and energy, with the reason behind each.",
    indexH1: "Daily horoscope", indexIntro: "Every reading starts from the real sky: today's Moon, Venus, Mars, Mercury, Jupiter and Saturn against your sign. Pick yours.",
    title: (s, d) => `${s} Horoscope Today, ${d} | Sussa`, tomorrowTitle: (s, d) => `${s} Horoscope Tomorrow, ${d} | Sussa`,
    desc: (s, d, o) => `${s} daily horoscope for ${d}. ${o} Love, career, money and energy from today's real planet positions.`,
    h1: (s) => `${s} horoscope today`, h1Tomorrow: (s) => `${s} horoscope tomorrow`,
    today: "Today", tomorrow: "Tomorrow", yesterdayNote: "The page updates every day at midnight.",
    skyToday: "The sky today", skySub: "Real positions, not a random quote.", whyLabel: "Why",
    cardOfDay: "Tarot card of the day", reversed: "reversed", aboutSign: (s) => `About ${s}`,
    element: "Element", quality: "Quality", ruler: "Ruler", strength: "Strength", watch: "Watch out",
    otherSigns: "Other signs",
    appTitle: "Your own reading, every morning", appText: "In the Sussa app the reading uses your birth chart too: Sun, Moon and Rising, personal transits, a yes/no ritual and a 30-day sky calendar.", appBtn: "Get Sussa on Google Play",
    compatIndexTitle: "Zodiac Compatibility: All Sign Pairs | Sussa", compatIndexDesc: "Love, friendship and work compatibility for every pair of zodiac signs, with a score and what to watch for.",
    compatH1: "Zodiac compatibility", compatIntro: "Pick two signs to see how they match in love, friendship and work.",
    compatTitle: (a, b) => `${a} and ${b} Compatibility: Love, Friendship, Work | Sussa`, compatDesc: (a, b, n) => `${a} and ${b} compatibility score ${n}%. How the pair works in love, friendship and at work.`,
    friendship: "Friendship", work: "Work", pickPair: "Compare two signs",
    tz: "America/New_York", locale: "en-US",
  },
  tr: {
    nav: "Burç yorumları", compatNav: "Burç uyumu",
    indexTitle: "Günlük Burç Yorumları: 12 Burç Bugün | Sussa", indexDesc: "Bütün burçlar için ücretsiz günlük burç yorumu. Gezegenlerin bugünkü gerçek konumlarına göre aşk, kariyer, para ve enerji, nedenleriyle.",
    indexH1: "Günlük burç yorumları", indexIntro: "Her yorum gerçek gökyüzünden başlar: bugünkü Ay, Venüs, Mars, Merkür, Jüpiter ve Satürn'ün burcunla ilişkisi. Burcunu seç.",
    title: (s, d) => `${s} Burcu Günlük Yorumu, ${d} | Sussa`, tomorrowTitle: (s, d) => `${s} Burcu Yarın, ${d} | Sussa`,
    desc: (s, d, o) => `${s} burcu ${d} günlük yorumu. ${o} Aşk, kariyer, para ve enerji, gezegenlerin bugünkü gerçek konumlarına göre.`,
    h1: (s) => `${s} burcu bugün`, h1Tomorrow: (s) => `${s} burcu yarın`,
    today: "Bugün", tomorrow: "Yarın", yesterdayNote: "Sayfa her gece yarısı yenilenir.",
    skyToday: "Bugün gökyüzü", skySub: "Rastgele bir söz değil, gerçek konumlar.", whyLabel: "Neden",
    cardOfDay: "Günün tarot kartı", reversed: "ters", aboutSign: (s) => `${s} burcu hakkında`,
    element: "Element", quality: "Nitelik", ruler: "Yönetici gezegen", strength: "Güçlü yanı", watch: "Dikkat",
    otherSigns: "Diğer burçlar",
    appTitle: "Her sabah sana özel yorum", appText: "Sussa uygulamasında yorum doğum haritanı da kullanır: Güneş, Ay ve Yükselen, kişisel transitler, evet/hayır ritüeli ve 30 günlük gökyüzü takvimi.", appBtn: "Sussa'yı Google Play'den indir",
    compatIndexTitle: "Burç Uyumu: Bütün Burç Çiftleri | Sussa", compatIndexDesc: "Her burç çifti için aşk, arkadaşlık ve iş uyumu: puan ve dikkat edilmesi gerekenler.",
    compatH1: "Burç uyumu", compatIntro: "Aşkta, arkadaşlıkta ve işte nasıl anlaştıklarını görmek için iki burç seç.",
    compatTitle: (a, b) => `${a} ve ${b} Burç Uyumu: Aşk, Arkadaşlık, İş | Sussa`, compatDesc: (a, b, n) => `${a} ve ${b} burç uyumu %${n}. Bu ikili aşkta, arkadaşlıkta ve işte nasıl anlaşır?`,
    friendship: "Arkadaşlık", work: "İş", pickPair: "İki burcu karşılaştır",
    tz: "Europe/Istanbul", locale: "tr-TR",
  },
  pt: {
    nav: "Horóscopo", compatNav: "Compatibilidade",
    indexTitle: "Horóscopo do Dia: Todos os 12 Signos Hoje | Sussa", indexDesc: "Horóscopo diário grátis para todos os signos, feito a partir da posição real dos planetas hoje: amor, trabalho, dinheiro e energia, com o motivo de cada um.",
    indexH1: "Horóscopo do dia", indexIntro: "Cada leitura começa no céu real: a Lua, Vênus, Marte, Mercúrio, Júpiter e Saturno de hoje em relação ao seu signo. Escolha o seu.",
    title: (s, d) => `Horóscopo de ${s} Hoje, ${d} | Sussa`, tomorrowTitle: (s, d) => `Horóscopo de ${s} Amanhã, ${d} | Sussa`,
    desc: (s, d, o) => `Horóscopo de ${s} para ${d}. ${o} Amor, trabalho, dinheiro e energia pela posição real dos planetas hoje.`,
    h1: (s) => `Horóscopo de ${s} hoje`, h1Tomorrow: (s) => `Horóscopo de ${s} amanhã`,
    today: "Hoje", tomorrow: "Amanhã", yesterdayNote: "A página é atualizada todos os dias à meia-noite.",
    skyToday: "O céu de hoje", skySub: "Posições reais, não uma frase aleatória.", whyLabel: "Por quê",
    cardOfDay: "Carta de tarô do dia", reversed: "invertida", aboutSign: (s) => `Sobre ${s}`,
    element: "Elemento", quality: "Qualidade", ruler: "Regente", strength: "Ponto forte", watch: "Atenção",
    otherSigns: "Outros signos",
    appTitle: "A sua leitura, toda manhã", appText: "No app Sussa a leitura usa também o seu mapa astral: Sol, Lua e Ascendente, trânsitos pessoais, ritual de sim ou não e calendário do céu de 30 dias.", appBtn: "Baixe o Sussa no Google Play",
    compatIndexTitle: "Compatibilidade dos Signos: Todos os Pares | Sussa", compatIndexDesc: "Compatibilidade no amor, na amizade e no trabalho para cada par de signos, com pontuação e cuidados.",
    compatH1: "Compatibilidade dos signos", compatIntro: "Escolha dois signos para ver como combinam no amor, na amizade e no trabalho.",
    compatTitle: (a, b) => `${a} e ${b}: Compatibilidade no Amor, Amizade e Trabalho | Sussa`, compatDesc: (a, b, n) => `Compatibilidade entre ${a} e ${b}: ${n}%. Como o casal funciona no amor, na amizade e no trabalho.`,
    friendship: "Amizade", work: "Trabalho", pickPair: "Compare dois signos",
    tz: "America/Sao_Paulo", locale: "pt-BR",
  },
  es: {
    nav: "Horóscopo", compatNav: "Compatibilidad",
    indexTitle: "Horóscopo de Hoy: los 12 Signos | Sussa", indexDesc: "Horóscopo diario gratis para todos los signos, hecho con la posición real de los planetas hoy: amor, trabajo, dinero y energía, con el porqué de cada uno.",
    indexH1: "Horóscopo de hoy", indexIntro: "Cada lectura parte del cielo real: la Luna, Venus, Marte, Mercurio, Júpiter y Saturno de hoy frente a tu signo. Elige el tuyo.",
    title: (s, d) => `Horóscopo de ${s} Hoy, ${d} | Sussa`, tomorrowTitle: (s, d) => `Horóscopo de ${s} Mañana, ${d} | Sussa`,
    desc: (s, d, o) => `Horóscopo de ${s} para el ${d}. ${o} Amor, trabajo, dinero y energía según la posición real de los planetas hoy.`,
    h1: (s) => `Horóscopo de ${s} hoy`, h1Tomorrow: (s) => `Horóscopo de ${s} mañana`,
    today: "Hoy", tomorrow: "Mañana", yesterdayNote: "La página se actualiza cada día a medianoche.",
    skyToday: "El cielo de hoy", skySub: "Posiciones reales, no una frase al azar.", whyLabel: "Por qué",
    cardOfDay: "Carta del tarot del día", reversed: "invertida", aboutSign: (s) => `Sobre ${s}`,
    element: "Elemento", quality: "Cualidad", ruler: "Regente", strength: "Fortaleza", watch: "Cuidado",
    otherSigns: "Otros signos",
    appTitle: "Tu propia lectura, cada mañana", appText: "En la app Sussa la lectura usa también tu carta natal: Sol, Luna y Ascendente, tránsitos personales, un ritual de sí o no y un calendario del cielo de 30 días.", appBtn: "Descarga Sussa en Google Play",
    compatIndexTitle: "Compatibilidad de Signos: Todas las Parejas | Sussa", compatIndexDesc: "Compatibilidad en el amor, la amistad y el trabajo para cada pareja de signos, con puntuación y en qué fijarse.",
    compatH1: "Compatibilidad de signos", compatIntro: "Elige dos signos para ver cómo encajan en el amor, la amistad y el trabajo.",
    compatTitle: (a, b) => `${a} y ${b}: Compatibilidad en el Amor, Amistad y Trabajo | Sussa`, compatDesc: (a, b, n) => `Compatibilidad entre ${a} y ${b}: ${n}%. Cómo funciona la pareja en el amor, la amistad y el trabajo.`,
    friendship: "Amistad", work: "Trabajo", pickPair: "Compara dos signos",
    tz: "America/Mexico_City", locale: "es-MX",
  },
  id: {
    nav: "Ramalan zodiak", compatNav: "Kecocokan zodiak",
    indexTitle: "Ramalan Zodiak Hari Ini untuk 12 Zodiak | Sussa", indexDesc: "Ramalan zodiak harian gratis untuk semua zodiak, dari posisi planet yang sebenarnya hari ini: cinta, karier, keuangan dan energi, lengkap dengan alasannya.",
    indexH1: "Ramalan zodiak hari ini", indexIntro: "Setiap ramalan dimulai dari langit nyata: Bulan, Venus, Mars, Merkurius, Jupiter dan Saturnus hari ini terhadap zodiakmu. Pilih zodiakmu.",
    title: (s, d) => `Ramalan Zodiak ${s} Hari Ini, ${d} | Sussa`, tomorrowTitle: (s, d) => `Ramalan Zodiak ${s} Besok, ${d} | Sussa`,
    desc: (s, d, o) => `Ramalan zodiak ${s} ${d}. ${o} Cinta, karier, keuangan dan energi dari posisi planet yang sebenarnya hari ini.`,
    h1: (s) => `Ramalan zodiak ${s} hari ini`, h1Tomorrow: (s) => `Ramalan zodiak ${s} besok`,
    today: "Hari ini", tomorrow: "Besok", yesterdayNote: "Halaman diperbarui setiap hari tengah malam.",
    skyToday: "Langit hari ini", skySub: "Posisi nyata, bukan kutipan acak.", whyLabel: "Mengapa",
    cardOfDay: "Kartu tarot hari ini", reversed: "terbalik", aboutSign: (s) => `Tentang ${s}`,
    element: "Elemen", quality: "Sifat", ruler: "Planet penguasa", strength: "Kekuatan", watch: "Hati-hati",
    otherSigns: "Zodiak lain",
    appTitle: "Ramalanmu sendiri, setiap pagi", appText: "Di aplikasi Sussa, ramalan juga memakai peta kelahiranmu: Matahari, Bulan dan Ascendant, transit pribadi, ritual ya/tidak dan kalender langit 30 hari.", appBtn: "Unduh Sussa di Google Play",
    compatIndexTitle: "Kecocokan Zodiak: Semua Pasangan | Sussa", compatIndexDesc: "Kecocokan cinta, persahabatan dan kerja untuk setiap pasangan zodiak, dengan skor dan hal yang perlu diperhatikan.",
    compatH1: "Kecocokan zodiak", compatIntro: "Pilih dua zodiak untuk melihat kecocokan dalam cinta, persahabatan dan pekerjaan.",
    compatTitle: (a, b) => `Kecocokan ${a} dan ${b}: Cinta, Persahabatan, Kerja | Sussa`, compatDesc: (a, b, n) => `Kecocokan ${a} dan ${b}: ${n}%. Bagaimana pasangan ini dalam cinta, persahabatan dan pekerjaan.`,
    friendship: "Persahabatan", work: "Pekerjaan", pickPair: "Bandingkan dua zodiak",
    tz: "Asia/Jakarta", locale: "id-ID",
  },
  vi: {
    nav: "Tử vi hôm nay", compatNav: "Độ hợp cung",
    indexTitle: "Tử Vi Hôm Nay 12 Cung Hoàng Đạo | Sussa", indexDesc: "Tử vi hằng ngày miễn phí cho 12 cung hoàng đạo, dựa trên vị trí thật của các hành tinh hôm nay: tình yêu, sự nghiệp, tài chính và năng lượng, kèm lý do.",
    indexH1: "Tử vi 12 cung hoàng đạo hôm nay", indexIntro: "Mỗi lời giải đều bắt đầu từ bầu trời thật: Mặt Trăng, Sao Kim, Sao Hỏa, Sao Thủy, Sao Mộc và Sao Thổ hôm nay so với cung của bạn. Chọn cung của bạn.",
    title: (s, d) => `Tử Vi Cung ${s} Hôm Nay, ${d} | Sussa`, tomorrowTitle: (s, d) => `Tử Vi Cung ${s} Ngày Mai, ${d} | Sussa`,
    desc: (s, d, o) => `Tử vi cung ${s} ngày ${d}. ${o} Tình yêu, sự nghiệp, tài chính và năng lượng theo vị trí thật của các hành tinh hôm nay.`,
    h1: (s) => `Tử vi cung ${s} hôm nay`, h1Tomorrow: (s) => `Tử vi cung ${s} ngày mai`,
    today: "Hôm nay", tomorrow: "Ngày mai", yesterdayNote: "Trang được cập nhật mỗi ngày lúc nửa đêm.",
    skyToday: "Bầu trời hôm nay", skySub: "Vị trí thật, không phải câu nói ngẫu nhiên.", whyLabel: "Vì sao",
    cardOfDay: "Lá bài tarot hôm nay", reversed: "ngược", aboutSign: (s) => `Về cung ${s}`,
    element: "Nguyên tố", quality: "Tính chất", ruler: "Hành tinh chủ quản", strength: "Điểm mạnh", watch: "Lưu ý",
    otherSigns: "Các cung khác",
    appTitle: "Lời giải của riêng bạn, mỗi sáng", appText: "Trong ứng dụng Sussa, lời giải còn dùng bản đồ sao của bạn: Mặt Trời, Mặt Trăng và cung Mọc, các vận hạn cá nhân, nghi thức có/không và lịch bầu trời 30 ngày.", appBtn: "Tải Sussa trên Google Play",
    compatIndexTitle: "Độ Hợp Nhau Giữa Các Cung Hoàng Đạo | Sussa", compatIndexDesc: "Độ hợp trong tình yêu, tình bạn và công việc cho từng cặp cung hoàng đạo, kèm điểm số và điều cần lưu ý.",
    compatH1: "Độ hợp cung hoàng đạo", compatIntro: "Chọn hai cung để xem họ hợp nhau thế nào trong tình yêu, tình bạn và công việc.",
    compatTitle: (a, b) => `${a} và ${b} Có Hợp Nhau Không: Tình Yêu, Tình Bạn, Công Việc | Sussa`, compatDesc: (a, b, n) => `Độ hợp giữa ${a} và ${b}: ${n}%. Cặp đôi này trong tình yêu, tình bạn và công việc.`,
    friendship: "Tình bạn", work: "Công việc", pickPair: "So sánh hai cung",
    tz: "Asia/Ho_Chi_Minh", locale: "vi-VN",
  },
};
