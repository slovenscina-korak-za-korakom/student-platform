import {
  IconBrandParsinta,
  IconCalendar,
  IconCalendarCheck,
  IconCalendarWeek,
  IconClubs,
  IconDashboard,
  IconFlask,
  IconHelp,
  IconProgressCheck,
  IconSettings,
  IconTrophy,
  IconUserCog,
} from "@tabler/icons-react";

export const webNavigation = [
  {name: "pricing", href: "/pricing"},
  // { name: "features", href: "/features" },
  {name: "about", href: "/about-us"},
];

export const stats = [
  {id: 1, title: "happy-students", value: "250", symbol: "+"},
  {id: 2, title: "lessons-conducted", value: "3000", symbol: "h"}, // in hours
  {id: 3, title: "student-satisfaction", value: "92", symbol: "%"}, // in percent
];

export const people = [
  {
    id: 1,
    name: ["Oleksandr", "Tyutyunnyk"],
    role: "CEO / Main Teacher",
    fluentIn: ["Slovene", "English", "Russian"],
    imageUrl: "/staff-images/foto-oleksandr.jpg",
  },
  {
    id: 2,
    name: ["Sebastjan", "Bas"],
    role: "Software Engineer",
    fluentIn: [""],
    imageUrl: "/staff-images/foto-me.jpg",
  },
  {
    id: 3,
    name: ["Sofiya", "Tyutyunnyk"],
    role: "Social Media & Teacher/Tutor",
    fluentIn: ["Slovene", "English", "Russian"],
    imageUrl: "/staff-images/foto-sofia.jpg",
  },
  {
    id: 4,
    name: ["Manca", "Levašič"],
    role: "Teacher/Tutor",
    fluentIn: ["Slovene", "English"],
    imageUrl: "/staff-images/foto-manca.png",
  },
  {
    id: 5,
    name: ["Ela", "Remic"],
    role: "Teacher/Tutor",
    fluentIn: ["Slovene", "Russian", "English"],
    imageUrl: "/staff-images/foto-ela.jpg",
  },
  {
    id: 6,
    name: ["Albina", "Kolesnikova"],
    role: "Social Media & Teacher/Tutor",
    fluentIn: [],
    imageUrl: "/staff-images/foto-albina.jpeg",
  },
  {
    id: 7,
    name: ["Ajda", "Fuchs Plemenitaš"],
    role: "Teacher/Tutor",
    fluentIn: [],
    imageUrl: "/staff-images/foto-ajda.jpeg",
  },
  {
    id: 8,
    name: ["Nataša", "Grešak"],
    role: "Teacher/Tutor",
    fluentIn: [],
    imageUrl: "/staff-images/foto-natasa.jpeg",
  }
];

export const reviews = [
  {
    id: 1,
    image: "/testimonials-images/foto-vlad.png",
    name: "Vlad Sirski",
    gender: "male",
    role: "student",
    text: "vlad-sirski",
    stars: [true, true, true, true, true],
  },
  {
    id: 2,
    image: "/testimonials-images/foto-anna.png",
    name: "Anna Popova",
    gender: "female",
    role: "student",
    text: "anna-popova",
    stars: [true, true, true, true, true],
  },
  {
    id: 3,
    image: "/testimonials-images/foto-oleksiy.png",
    name: "Oleksiy Molchanov",
    gender: "male",
    role: "student",
    text: "alexander-molchanov",
    stars: [true, true, true, true, true],
  },
  {
    id: 4,
    image: "/testimonials-images/foto-evgenia.png",
    name: "Evgenia Rudakova",
    gender: "female",
    role: "student",
    text: "evgenia-rudakova",
    stars: [true, true, true, true, true],
  },
  {
    id: 5,
    image: "/testimonials-images/foto-violeta.png",
    name: "Violeta Lisin",
    gender: "female",
    role: "student",
    text: "violeta-lisin",
    stars: [true, true, true, true, true],
  },
  {
    id: 6,
    image: "/testimonials-images/foto-oleg.png",
    name: "Oleg Kotelnikov",
    gender: "male",
    role: "student",
    text: "oleg-kotelnikov",
    stars: [true, true, true, true, true],
  },
  {
    id: 7,
    image: "/testimonials-images/foto-michael.jpg",
    name: "Michael Sverdlov",
    gender: "male",
    role: "student",
    text: "michael-sverdlov",
    stars: [true, true, true, true, true],
  },
  {
    id: 8,
    image: "/testimonials-images/foto-marina.jpg",
    name: "Marina Kurkina",
    gender: "female",
    role: "student",
    text: "marina-kurkina",
    stars: [true, true, true, true, true],
  },
  {
    id: 9,
    image: "/testimonials-images/foto-kateryna.jpg",
    name: "Kateryna Levytska",
    gender: "female",
    role: "student",
    text: "kateryna-levytska",
    stars: [true, true, true, true, true],
  }

];

export const footerLinks = {
  Personal: [
    {name: "profile", href: "/settings"},
    {name: "settings", href: "/settings"},
    {name: "dashboard", href: "/dashboard"},
  ],
  QuickLinks: [
    {name: "home", href: "/", server: false},
    {name: "pricing", href: "/pricing", server: false},
    {name: "lang-club", href: "/pricing#lang-club", server: true},
  ],
  Company: [
    {name: "about", href: "/about-us"},
    {
      name: "contact",
      href: "mailto:sebastjan.bas@gmail.com?cc=almn140803@gmail.com&subject=[Slovenščina Korak za Korkom] - Support&body=<Enter your message here.>",
    },
    {name: "faq", href: "/pricing#FAQ"},
  ],
  Legal: [
    {name: "terms-of-service", href: "/legal/terms-of-service"},
    {name: "privacy-policy", href: "/legal/privacy-policy"},
    {name: "license", href: "/legal/license"},
  ],
};

export const offers = [
  {
    id: "tier-duo",
    href: "/dashboard",
    priceMonthly: {
      senior: "€13.00",
      junior: "€11.00"
    },
    description: "plan1-desc",
    features: 13,
    featured: false,
  },
  {
    id: "tier-individual",
    href: "dashboard",
    priceMonthly: {
      senior: "€22.00",
      junior: "€20.00"
    },
    description: "plan2-desc",
    features: 13,
    featured: true,
  },
  {
    id: "tier-family",
    href: "/dashboard",
    priceMonthly: {
      senior: "€17.00",
      junior: "€15.00"
    },
    description: "plan3-desc",
    features: 13,
    featured: false,
  },
];

export const SidebarNavigationData = {
  navMain: [
    {
      title: "dashboard",
      url: "/dashboard",
      icon: IconDashboard,
      disabled: false,
    },
    {
      title: "courses",
      url: "/courses",
      icon: IconBrandParsinta,
      disabled: false,
    },
    {
      title: "calendar",
      url: "/calendar",
      icon: IconCalendarWeek,
      disabled: false,
    },
    {
      title: "language-club",
      url: "/language-club",
      icon: IconClubs,
      disabled: false,
    },
    {
      title: "daily-practice",
      url: "daily-practice",
      icon: IconFlask,
      disabled: false,
    },
  ],
  navSecondary: [
    {
      title: "settings",
      url: "/settings",
      icon: IconSettings,
      disabled: false,
    },
    {
      title: "get-help",
      url: "mailto:almn140803@gmail.com?cc=sebastjan.bas@gmail.com&subject=[Slovenščina Korak za Korkom] - Support&body=<Enter your message here.>",
      icon: IconHelp,
      disabled: false,
    },
  ],
  myProgress: [
    {
      title: "my-lessons",
      url: "#",
      icon: IconCalendarCheck,
      disabled: true,
    },
    {
      title: "achievements",
      url: "#",
      icon: IconTrophy,
      disabled: true,
    },
    {
      title: "progress",
      url: "#",
      icon: IconProgressCheck,
      disabled: true,
    },
  ],
  admin: [
    {
      title: "dashboard",
      url: "/admin",
      icon: IconUserCog,
      disabled: false,
    },
    {
      title: "language-club",
      url: "/admin/language-club-admin",
      icon: IconClubs,
      disabled: false,
    },
    {
      title: "bookings",
      url: "/admin/booking",
      icon: IconCalendar,
      disabled: false,
    },
  ],
};

export const languageLevels = [
  {
    value: "A1",
    label: {
      ru: "A1 - Начальный",
      en: "A1 - Beginner",
      it: "A1 - Principiante",
      sl: "A1 - Začetnik",
    },
    description: {
      ru: "Нет предыдущих знаний словенского языка.",
      en: "No prior knowledge of Slovenian.",
      it: "Nessuna conoscenza pregressa di sloveno.",
      sl: "Nič predhodnega znanja slovenščine.",
    },
    icon: "👶🏻",
  },
  {
    value: "A2",
    label: {
      ru: "A2 - Средний",
      en: "A2 - Elementary",
      it: "A2 - Elementare",
      sl: "A2 - Začetnik plus",
    },
    description: {
      ru: "Базовое понимание и простые разговоры.",
      en: "Basic understanding and simple conversations.",
      it: "Comprendere e conversare in modo semplice.",
      sl: "Osnovno razumevanje, preprosti pogovori.",
    },
    icon: "👦🏻",
  },
  {
    value: "B1",
    label: {
      ru: "B1 - Средний",
      en: "B1 - Intermediate",
      it: "B1 - Intermedio",
      sl: "B1 - Srednji nivo",
    },
    description: {
      ru: "Может обрабатывать большинство повседневных разговоров.",
      en: "Can handle most everyday conversations.",
      it: "Capire e conversare in modo fluente.",
      sl: "Dobro razumevanje osnovnih pogovorov.",
    },
    icon: "👨🏻",
  },
  {
    value: "B2",
    label: {
      ru: "B2 - Продвинутый",
      en: "B2 - Advanced",
      it: "B2 - Avanzato",
      sl: "B2 - Visok nivo",
    },
    description: {
      ru: "Хорошее понимание в большинстве разговоров.",
      en: "Good understanding and fluency in specific conversations.",
      it: "Comprendere e conversare in modo fluente.",
      sl: "Dobro razumevanje in uporaba jezika.",
    },
    icon: "🧔🏻‍♂️",
  },
  {
    value: "C1",
    label: {
      ru: "C1 - Мастер",
      en: "C1 - Master",
      it: "C1 - Maestro",
      sl: "C1 - Master",
    },
    description: {
      ru: "Беглое и стильное использование языка.",
      en: "Fluent and sophisticated use of the language.",
      it: "Padroneggiare la lingua in modo fluente e sofisticato.",
      sl: "Odlično razumevanje in uporaba jezika.",
    },
    icon: "🎅🏻",
  },
];

export const tutors = [
  {
    id: 1,
    name: "Ela Remic",
    avatar: "/staff-images/foto-ela.jpg",
    bio: "Привет! Меня зовут Эла, я студентка русского и польского языков из окрестностей Любляны. Меня интересуют иностранные языки, культуры, литература и искусство.\n\nЯ хочу приблизить вам словенский язык с помощью вашего родного языка — так, чтобы вам было легче и понятнее. На пути к отличному знанию словенского я познакомлю вас также со словенской культурой, обычаями, искусством, разговорной лексикой и фразами.\n\nТаким образом вы шаг за шагом сможете без труда общаться, лучше ориентироваться в среде, в которой живёте и работаете, и устанавливать контакты со словенцами.\n\n\n Živijo! Ime mi Ela in sem študentka ruščine in poljščine iz okolice Ljubljane. Zanimajo me tuji jeziki, kulture, kniževnost in umetnost.\n Slovenski jezik vam želim približati s pomočjo vašega jezika na način, ki bo za vas lažje razumljiv. Na poti do odličnega znanja slovenščine vas bom seznanila tudi s slovensko kulturo, običaji, umetnostjo, pogovornimi besedami in frazami. Na ta način se boste, korak za korakom, lahko brez težav sporazumevali, bolje znašli v okolju, v katerem živite in delate ter navezovali stike s Slovenci.",
    description: {
      ru: "Senior Tutor",
      en: "Senior Tutor",
      it: "Senior Tutor",
      sl: "Senior Tutor",
    },
  },
  {
    id: 2,
    name: "Oleksandr Tyutyunnyk",
    avatar: "/staff-images/foto-oleksandr3.jpg",
    bio: "No bio",
    description: {
      ru: "Senior Tutor",
      en: "Senior Tutor",
      it: "Senior Tutor",
      sl: "Senior Tutor",
    },
  },
  {
    id: 3,
    name: "Sofia Tyutyunnyk",
    avatar: "/staff-images/foto-sofia.jpg",
    bio: "No bio",
    description: {
      ru: "Senior Tutor",
      en: "Senior Tutor",
      it: "Senior Tutor",
      sl: "Senior Tutor",
    },
  },
  {
    id: 4,
    name: "Albina Kolesnikova",
    avatar: "/staff-images/foto-albina.jpeg",
    bio: "Меня зовут Альбина, я репетитор словенского языка. В Словении я живу уже почти десять лет, поэтому хорошо её знаю. Здесь я окончила основную школу и гимназию, а сейчас изучаю биологию в Университете Марибора. Параллельно я развиваю собственный бренд украшений ручной работы, через который выражаю свою творческую сторону.\n\nЯ считаю себя сильной, харизматичной и целеустремлённой личностью, которая любит поддерживать других на их пути обучения. Я уверена, что лучше всего мы учимся в поддерживающей и приятной атмосфере. В людях я больше всего ценю доброту, открытость и искреннее стремление узнавать новое.\n——\nIme mi je Albina in sem tutorica slovenščine. V Sloveniji živim že skoraj deset let, zato jo res dobro poznam. Tukaj sem zaključila osnovno šolo in gimnazijo, trenutno pa študiram biologijo na Univerzi v Mariboru. Ob tem vodim tudi svojo blagovno znamko ročno izdelanega nakita, ki izraža moj ustvarjalni del.\n\nSebe bi opisala kot močno, karizmatično in vztrajno osebo, ki rada podpira druge na njihovi poti učenja. Verjamem, da se največ naučimo v spodbudnem in prijetnem okolju. Pri ljudeh najbolj cenim prijaznost, odprtost ter iskreno željo po spoznavanju novih stvari.",
    description: {
      ru: "Junior Tutor",
      en: "Junior Tutor",
      it: "Junior Tutor",
      sl: "Junior Tutor",
    },
  },
  {
    id: 5,
    name: "Ajda Fuchs Plemenitaš",
    avatar: "/staff-images/foto-ajda.jpeg",
    bio: "No bio",
    description: {
      ru: "Junior Tutor",
      en: "Junior Tutor",
      it: "Junior Tutor",
      sl: "Junior Tutor",
    },
  },
  {
    id: 6,
    name: "Nataša Grešak",
    avatar: "/staff-images/foto-natasa.jpeg",
    bio: "No bio",
    description: {
      ru: "Junior Tutor",
      en: "Junior Tutor",
      it: "Junior Tutor",
      sl: "Junior Tutor",
    },
  }
];

export const learningGoals = [
  {
    value: "national exam",
    label: {
      ru: "Государственный экзамен",
      en: "National exam",
      it: "Esame nazionale",
      sl: "Državni izpit",
    },
    description: {
      ru: "Подготовка к официальным тестам и сертификации.",
      en: "Preparation for official tests and certification.",
      it: "Preparazione per test ufficiali e certificazioni.",
      sl: "Priprava na uradne izpite in certificiranje.",
    },
    icon: "📝",
  },
  {
    value: "integration",
    label: {
      ru: "Интеграция в среду",
      en: "Integration into the environment",
      it: "Integrazione nell'ambiente",
      sl: "Integracija v okolje",
    },
    description: {
      ru: "Освоение языка для повседневной жизни и адаптации в обществе.",
      en: "Mastering the language for daily life and social adaptation.",
      it: "Padroneggiare la lingua per la vita quotidiana e l'adattamento sociale.",
      sl: "Učenje jezika za vsakdanje življenje in vključevanje v družbo.",
    },
    icon: "🇸🇮",
  },
  {
    value: "school",
    label: {
      ru: "Экзамены и школа (Matura / NPZ)",
      en: "Exams & School (Matura / NPZ)",
      it: "Esami & Scuola (Matura / NPZ)",
      sl: "Matura / NPZ / Šola",
    },
    description: {
      ru: "Поддержка в учебе, подготовка к NPZ и выпускным экзаменам.",
      en: "Study support, preparation for NPZ and final school exams.",
      it: "Supporto allo studio, preparazione per NPZ ed esami di maturità.",
      sl: "Pomoč pri študiju, pripravi na maturo in šolskih obveznostih.",
    },
    icon: "🎓",
  },
  {
    value: "speaking",
    label: {
      ru: "Разговорная практика",
      en: "Speaking practice",
      it: "Pratica orale",
      sl: "Govorna praksa",
    },
    description: {
      ru: "Развитие навыков общения и уверенности в речи.",
      en: "Developing communication skills and speaking confidence.",
      it: "Sviluppare abilità comunicative e sicurezza nel parlare.",
      sl: "Razvijanje komunikacijskih veščin in samozavesti pri govorjenju.",
    },
    icon: "💬",
  },
];

