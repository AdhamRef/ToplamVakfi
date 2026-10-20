/**
 * Institutional SEO for the public locales (ar, en, tr, sq).
 *
 * Copy taken from the Toplum Vakfı design (`ToplamVakfi-design/`): the site
 * name and title pattern from the pages' `<title>` ("… — وقف التضامن
 * الاجتماعي"), the description from the homepage hero and the organisation
 * facts the design states (founded 1995, waqf registry 3673, 20+ countries).
 * English, Turkish and Albanian follow the design's own dictionary
 * (`ToplamVakfi-design/i18n.js`) where it has the phrase.
 *
 * `scripts/generate-minbar-seo.mjs` produced the previous (Minbar) version of
 * this file from the old handoff bundles; it no longer applies — edit this file
 * directly. `lib/seo.ts` re-exports it as `LOCALE_SEO` / `OG_LOCALE_MAP`, and
 * `tests/integration-settings/seo-legacy-contamination.test.ts` guards it.
 */

export const MINBAR_OG_LOCALES = {
  "ar": "ar_SA",
  "en": "en_US",
  "tr": "tr_TR",
  "sq": "sq_AL"
} as const;

const EN_ENTRY = {
  "siteName": "Toplumsal Dayanışma Vakfı",
  "title": "Toplumsal Dayanışma Vakfı — Toplum Vakfı",
  "description": "A charitable foundation registered in Istanbul since 1995 (waqf registry no. 3673), working in more than 20 countries on orphan care, education, relief, clean water, and Qur’an and values — for fairer, kinder communities that uphold dignity.",
  "keywords": [
    "Toplum Vakfı",
    "Toplumsal Dayanışma Vakfı",
    "donate now",
    "orphan care",
    "education and scholarships",
    "humanitarian relief",
    "clean water and wells",
    "Qur’an and values",
    "sadaqah jariyah",
    "zakat",
    "zakat calculator"
  ],
  "titleTemplate": "%s — Toplumsal Dayanışma Vakfı",
  "campaigns": {
    "title": "Our projects — Toplumsal Dayanışma Vakfı",
    "description": "Projects of Toplumsal Dayanışma Vakfı open for donations: orphan care, education and scholarships, humanitarian relief, clean water and wells, and Qur’an and values."
  },
  "about": {
    "title": "About us — Toplumsal Dayanışma Vakfı",
    "description": "Toplumsal Dayanışma Vakfı (Toplum Vakfı) is a charitable foundation established in Istanbul in 1995, waqf registry no. 3673, working in more than 20 countries for stronger communities and greater human dignity."
  },
  "contact": {
    "title": "Contact us — Toplumsal Dayanışma Vakfı",
    "description": "Reach Toplumsal Dayanışma Vakfı in Istanbul by email, phone or WhatsApp, or visit our office in Bağcılar, with any question about giving, our projects or partnerships."
  },
  "blog": {
    "title": "Blog — Toplumsal Dayanışma Vakfı",
    "description": "Articles from Toplumsal Dayanışma Vakfı on giving and values, impact stories from the field, and what our team learns working alongside orphans, families and communities."
  }
};

export const MINBAR_LOCALE_SEO = {
  "ar": {
    "siteName": "وقف التضامن الاجتماعي",
    "title": "وقف التضامن الاجتماعي — Toplum Vakfı",
    "description": "وقف خيري مسجّل في إسطنبول منذ عام 1995 (السجل الوقفي 3673)، يعمل في أكثر من 20 دولة لرعاية الأيتام والتعليم والإغاثة والمياه والقرآن والقيم، من أجل مجتمعات أكثر عدلاً ورحمة وكرامة.",
    "keywords": [
      "وقف التضامن الاجتماعي",
      "Toplum Vakfı",
      "تبرع الآن",
      "رعاية الأيتام",
      "التعليم والمنح الدراسية",
      "الإغاثة الإنسانية",
      "المياه النظيفة والآبار",
      "القرآن والقيم",
      "صدقة جارية",
      "الزكاة",
      "حاسبة الزكاة"
    ],
    "titleTemplate": "%s — وقف التضامن الاجتماعي",
    "campaigns": {
      "title": "مشاريعنا — وقف التضامن الاجتماعي",
      "description": "مشاريع وقف التضامن الاجتماعي المفتوحة للتبرع: رعاية الأيتام، والتعليم والمنح الدراسية، والإغاثة الإنسانية، والمياه النظيفة والآبار، والقرآن والقيم."
    },
    "about": {
      "title": "من نحن — وقف التضامن الاجتماعي",
      "description": "وقف التضامن الاجتماعي (Toplum Vakfı) وقف خيري تأسس عام 1995 في إسطنبول، مسجّل برقم السجل الوقفي 3673، يعمل في أكثر من 20 دولة لبناء مجتمعات أقوى وإنسان أكثر كرامة."
    },
    "contact": {
      "title": "تواصل معنا — وقف التضامن الاجتماعي",
      "description": "تواصل مع وقف التضامن الاجتماعي في إسطنبول عبر البريد الإلكتروني أو الهاتف أو واتساب، أو زر مقرّنا في باغجلار، لأي سؤال عن التبرع والمشاريع والشراكات."
    },
    "blog": {
      "title": "المدونة — وقف التضامن الاجتماعي",
      "description": "مقالات وقف التضامن الاجتماعي عن العطاء والقيم، وقصص الأثر من الميدان، وما يتعلّمه فريقنا من العمل مع الأيتام والأسر والمجتمعات."
    }
  },
  "en": EN_ENTRY,

  "tr": {
    "siteName": "Toplumsal Dayanışma Vakfı",
    "title": "Toplumsal Dayanışma Vakfı — Toplum Vakfı",
    "description": "1995’ten bu yana İstanbul’da kayıtlı (vakıf sicil no. 3673) bir hayır vakfı; 20’den fazla ülkede yetim bakımı, eğitim, insani yardım, temiz su ile Kur’an ve değerler alanında daha adil, merhametli ve onurlu toplumlar için çalışıyor.",
    "keywords": [
      "Toplum Vakfı",
      "Toplumsal Dayanışma Vakfı",
      "bağış yap",
      "yetim bakımı",
      "eğitim ve burslar",
      "insani yardım",
      "temiz su ve kuyular",
      "Kur’an ve değerler",
      "sadaka-i câriye",
      "zekât",
      "zekât hesaplama"
    ],
    "titleTemplate": "%s — Toplumsal Dayanışma Vakfı",
    "campaigns": {
      "title": "Projelerimiz — Toplumsal Dayanışma Vakfı",
      "description": "Toplumsal Dayanışma Vakfı’nın bağışa açık projeleri: yetim bakımı, eğitim ve burslar, insani yardım, temiz su ve kuyular ile Kur’an ve değerler."
    },
    "about": {
      "title": "Hakkımızda — Toplumsal Dayanışma Vakfı",
      "description": "Toplumsal Dayanışma Vakfı (Toplum Vakfı), 1995’te İstanbul’da kurulmuş, 3673 sicil numarasıyla kayıtlı bir hayır vakfıdır; daha güçlü toplumlar ve daha onurlu insanlar için 20’den fazla ülkede çalışır."
    },
    "contact": {
      "title": "İletişim — Toplumsal Dayanışma Vakfı",
      "description": "Bağış, projelerimiz veya ortaklıklar hakkındaki her sorunuz için Toplumsal Dayanışma Vakfı’na e-posta, telefon ya da WhatsApp ile ulaşın veya Bağcılar’daki ofisimizi ziyaret edin."
    },
    "blog": {
      "title": "Blog — Toplumsal Dayanışma Vakfı",
      "description": "Toplumsal Dayanışma Vakfı’ndan iyilik ve değerler üzerine yazılar, sahadan etki hikâyeleri ve ekibimizin yetimler, aileler ve toplumlarla çalışırken öğrendikleri."
    }
  },
  "sq": {
    "siteName": "Toplumsal Dayanışma Vakfı",
    "title": "Toplumsal Dayanışma Vakfı — Toplum Vakfı",
    "description": "Fondacion bamirës i regjistruar në Stamboll që nga viti 1995 (regjistri i vakëfeve nr. 3673), që punon në më shumë se 20 vende për kujdesin ndaj jetimëve, arsimin, ndihmën humanitare, ujin e pastër dhe Kur’anin e vlerat — për komunitete më të drejta, më të mëshirshme dhe me dinjitet.",
    "keywords": [
      "Toplum Vakfı",
      "Toplumsal Dayanışma Vakfı",
      "dhuro tani",
      "kujdesi për jetimët",
      "arsimi dhe bursat",
      "ndihma humanitare",
      "ujë i pastër dhe puse",
      "Kur’ani dhe vlerat",
      "sadaka e vazhdueshme",
      "zekati",
      "llogaritësi i zekatit"
    ],
    "titleTemplate": "%s — Toplumsal Dayanışma Vakfı",
    "campaigns": {
      "title": "Projektet tona — Toplumsal Dayanışma Vakfı",
      "description": "Projektet e Toplumsal Dayanışma Vakfı të hapura për dhurime: kujdesi për jetimët, arsimi dhe bursat, ndihma humanitare, uji i pastër dhe puset, si dhe Kur’ani e vlerat."
    },
    "about": {
      "title": "Rreth nesh — Toplumsal Dayanışma Vakfı",
      "description": "Toplumsal Dayanışma Vakfı (Toplum Vakfı) është një fondacion bamirës i themeluar në Stamboll në vitin 1995, me numër regjistri 3673, që punon në më shumë se 20 vende për komunitete më të forta dhe dinjitet më të madh njerëzor."
    },
    "contact": {
      "title": "Na kontaktoni — Toplumsal Dayanışma Vakfı",
      "description": "Kontaktoni Toplumsal Dayanışma Vakfı në Stamboll me email, telefon ose WhatsApp, ose vizitoni zyrën tonë në Bağcılar, për çdo pyetje rreth dhurimeve, projekteve ose partneriteteve."
    },
    "blog": {
      "title": "Blogu — Toplumsal Dayanışma Vakfı",
      "description": "Shkrime nga Toplumsal Dayanışma Vakfı për bamirësinë dhe vlerat, histori ndikimi nga terreni dhe çfarë mëson ekipi ynë duke punuar me jetimët, familjet dhe komunitetet."
    }
  },
  /* Registered but not publicly routed (lib/locales.ts FUTURE_LOCALES): their URLs
     redirect to English, so they carry the English entry. The four whose script
     is not Latin get the description in that script, as the SEO test requires. */
  ...Object.fromEntries(
    ["fr", "de", "es", "id", "pt", "it", "nl", "sv", "no", "da", "ms"].map((code) => [code, EN_ENTRY])
  ),
  "ur": { ...EN_ENTRY, "description": "استنبول میں 1995 سے رجسٹرڈ ایک خیراتی وقف (وقف رجسٹری نمبر 3673)، جو 20 سے زیادہ ممالک میں یتیموں کی کفالت، تعلیم، امداد، صاف پانی اور قرآن و اقدار کے لیے کام کرتا ہے۔" },
  "ja": { ...EN_ENTRY, "description": "1995年からイスタンブールに登録された慈善財団（ワクフ登録番号3673）。20か国以上で孤児支援、教育、人道支援、清潔な水、クルアーンと価値観の分野で活動しています。" },
  "zh": { ...EN_ENTRY, "description": "自1995年起在伊斯坦布尔注册的慈善基金会（瓦克夫登记号3673），在20多个国家开展孤儿关怀、教育、人道救援、清洁饮水以及古兰经与价值观项目。" },
  "hi": { ...EN_ENTRY, "description": "1995 से इस्तांबुल में पंजीकृत एक धर्मार्थ वक़्फ़ (वक़्फ़ रजिस्ट्री संख्या 3673), जो 20 से अधिक देशों में अनाथों की देखभाल, शिक्षा, राहत, स्वच्छ जल तथा क़ुरआन और मूल्यों के लिए काम करता है।" }
};
