export type PlacementQuestion = {
  id: number;
  level: "A0-A1" | "A2" | "B1" | "B2" | "C1";
  type: "multiple_choice" | "gap_fill";
  question: string;
  options?: {
    id: string;
    text: string;
  }[];
  correctAnswer: string;
};

export const placementQuestions: PlacementQuestion[] = [
  // A0-A1 Level (Questions 1-5)
  {
    id: 1,
    level: "A0-A1",
    type: "multiple_choice",
    question: "V trgovini vidiš napis \"AKCIJA – 50 %\". Kaj to pomeni?",
    options: [
      { id: "a", text: "V trgovini je nova blagajna." },
      { id: "b", text: "Izdelek je cenejši." },
      { id: "c", text: "Izdelek je dražji." },
    ],
    correctAnswer: "b",
  },
  {
    id: 2,
    level: "A0-A1",
    type: "multiple_choice",
    question: "Pazi! Na tleh je napis: \"MOKRA TLA\". Kaj to pomeni?",
    options: [
      { id: "a", text: "Moramo počakati v vrsti." },
      { id: "b", text: "Moramo obuti copate." },
      { id: "c", text: "Moramo biti previdni, ker je spolzko." },
    ],
    correctAnswer: "c",
  },
  {
    id: 3,
    level: "A0-A1",
    type: "multiple_choice",
    question: "Vprašanje v dialogu: – Od kod si? – Sem iz …",
    options: [
      { id: "a", text: "Kranju" },
      { id: "b", text: "Ljubljani" },
      { id: "c", text: "Ljubljane" },
    ],
    correctAnswer: "c",
  },
  {
    id: 4,
    level: "A0-A1",
    type: "multiple_choice",
    question:
      "Na avtobusu slišiš: \"Naslednja postaja – Glavna postaja.\" Kaj to pomeni?",
    options: [
      { id: "a", text: "Avtobus se bo ustavil čez dve postaji pri glavni postaji." },
      { id: "b", text: "Avtobus se bo ustavil pri glavni postaji." },
      { id: "c", text: "Avtobus ne bo več ustavljal." },
    ],
    correctAnswer: "b",
  },
  {
    id: 5,
    level: "A0-A1",
    type: "multiple_choice",
    question: "Na vratih piše: \"ODPRTO.\" Kaj to pomeni?",
    options: [
      { id: "a", text: "Trgovina je odklenjena." },
      { id: "b", text: "Trgovina je zaprta." },
      { id: "c", text: "Trgovina je odprta." },
    ],
    correctAnswer: "c",
  },

  // A2 Level (Questions 6-10)
  {
    id: 6,
    level: "A2",
    type: "multiple_choice",
    question:
      "Dopolnite: \"Včeraj sem pila kavo. S prijateljico Saro sva šli v kavarno in _______ o izpitu",
    options: [
      { id: "a", text: "se progovarjali" },
      { id: "b", text: "se pogovarjale" },
      { id: "c", text: "sem se pogovarjale" },
    ],
    correctAnswer: "a",
  },
  {
    id: 7,
    level: "A2",
    type: "multiple_choice",
    question:
      "Ura je 22.40\nKako bi povedali koliko je ura?",
    options: [
      { id: "a", text: "Dvajset do enajstih." },
      { id: "b", text: "Dvajset minut do triindvajsete ure." },
      { id: "c", text: "Dvajset minut za triindvajseto." },
    ],
    correctAnswer: "b",
  },
  {
    id: 8,
    level: "A2",
    type: "multiple_choice",
    question: "Izberi pravilno obliko:\nVčeraj sem _______ v hribe.",
    options: [
      { id: "a", text: "šel hoditi" },
      { id: "b", text: "hodil" },
      { id: "c", text: "šel hodit" },
    ],
    correctAnswer: "c",
  },
  {
    id: 9,
    level: "A2",
    type: "multiple_choice",
    question:
      "Dololni:\n\"Živjo! Jutri _______ _______ v trgovino, zato ne grem s tabo na kavo.\"",
    options: [
      { id: "a", text: "morem iti." },
      { id: "b", text: "moram gresti." },
      { id: "c", text: "moram iti." },
    ],
    correctAnswer: "c",
  },
  {
    id: 10,
    level: "A2",
    type: "multiple_choice",
    question:
      "Izberi pravilno možnost\nOb nedeljah lahko _______ cel dan.",
    options: [
      { id: "a", text: "počivam" },
      { id: "b", text: "počivati" },
      { id: "c", text: "si odpočivam" },
    ],
    correctAnswer: "a",
  },

  // B1 Level (Questions 11-15)
  {
    id: 11,
    level: "B1",
    type: "gap_fill",
    question:
      "Dololni z zaimki:\nVelja mama, jutri _______ (ti) pokličem. Povedala _______ (ti) bom nekaj zanimivega o _______ (moji) sodelavcih.",
    correctAnswer: "te,ti,mojih",
  },
  {
    id: 12,
    level: "B1",
    type: "multiple_choice",
    question:
      "Dopolni:\n\"Na _______ je življenje bolj mirno in počasno. Nikoli, ne bi želel živeti v mestu\"",
    options: [
      { id: "a", text: "vasu." },
      { id: "b", text: "vase." },
      { id: "c", text: "vasi." },
    ],
    correctAnswer: "c",
  },
  {
    id: 13,
    level: "B1",
    type: "gap_fill",
    question:
      "Dopolni besedilo s frazami všeč:\n - (onadva): Všeč _______ _______ slovenščina.\n - (onidve): Všeč _______ _______ pogovorni klub.\n - (one) Všeč _______ _______ modalni glagoli.",
    correctAnswer: "jima je,jima je,so jim",
  },
  {
    id: 14,
    level: "B1",
    type: "multiple_choice",
    question:
      "Preberi novico:\n\"Ta konec tedna bodo v mestu praznovali občinski praznik. Na trgu prireditev z narodnozabavno glasbo in srečolov.\"\nKaj bo v mestu?",
    options: [
      { id: "a", text: "Veselica." },
      { id: "b", text: "Praznovanje ustanovitve nove občine." },
      { id: "c", text: "Koncert in lov na srečke." },
    ],
    correctAnswer: "a",
  },
  {
    id: 15,
    level: "B1",
    type: "multiple_choice",
    question:
      "Preberi članek:\n\"V zadnjem letu je število turistov v Sloveniji poskočilo za 15 %. Največ jih prihaja iz Nemčije in Italije.\"\nKaj pravi besedilo?",
    options: [
      { id: "a", text: "Število turistov je zaskočilo." },
      { id: "b", text: "Število turistov je naraslo." },
      { id: "c", text: "Turisti prihajajo samo iz Evrope." },
    ],
    correctAnswer: "b",
  },

  // B2 Level (Questions 16-20)
  {
    id: 16,
    level: "B2",
    type: "gap_fill",
    question:
      "Pretvori poved z odvisnimi stavki v enostavčno poved.\n" +
      "Ko je končala študi, se je preselila v tujino.\n" +
      "-> Po _______ študija se je preselila v tujino.\n" +
      "Ker ni imal dovilj časa, naloge ni dokončal.\n" +
      "-> Zaradi _______ časa naloge ni dokončal.\n" +
      "Čeprav je bil utrujen, je nadaljeval z delom.\n" +
      "-> Kljub _______ je nadaljeval z delom.",
    correctAnswer: "končanju,premalo,utrujenosti",
  },
  {
    id: 17,
    level: "B2",
    type: "gap_fill",
    question:
      "S katerimi vezniki bi združili ti dve povedi?\n" +
      "- Zamudil je avtobus. Prišel je prepozno.\n" +
      "- Učila se je celo noč. Ni opravila izpita.\n" +
      "- Pokliči me. Prideš domov.",
    correctAnswer: "zato ker|ker,čeprav,ko",
  },
  {
    id: 18,
    level: "B2",
    type: "gap_fill",
    question:
      "Preberi odlomek in dopolni z zaimki:\n" +
      "To je moj prijatelj Luka. Poznam _______ že dolgo, vsak teden igrava košarko skupaj. " +
      "Pogosto _______ zastavljam vprašanja, povezana s športom in zdravo prehrano. Večkrat greva skupaj v fitnes. " +
      "V _______ telovadiva in dvigujeva uteži. Brez _______ zagotovo ne bi vedel, kako napredovati v športu.",
    correctAnswer: "ga,mu,njem,njega",
  },
  {
    id: 19,
    level: "B2",
    type: "multiple_choice",
    question:
      "Preberi odlomek:\n\"V Sloveniji se vse več ljudi odloča za delo od doma. Ta način prinaša večjo fleksibilnost, " +
      "hkrati pa tudi slabe plati, kot so manj komunikacije s sodelavci in težave pri organizaciji časa.\n" +
      "Katera je ena od pomankljivosti dela od doma?",
    options: [
      { id: "a", text: "Fleksibilnost." },
      { id: "b", text: "Manj stika s sodelavci." },
      { id: "c", text: "Več prostega časa." },
    ],
    correctAnswer: "b",
  },
  {
    id: 20,
    level: "B2",
    type: "gap_fill",
    question:
      "Preberi in dopolni z modalnimi (naklonskimi) glagoli.\nJutri žal ne _______ priti na obisk. V službi imam veliko dela, oddati _______ poročilo do petka. _______ se " +
      "vidiva v soboto. Zelo si te _______ videti. _______ si, da bi bil že vikend",
    correctAnswer: "morem,moram,lahko,želim,želim",
  },

  // C1 Level (Questions 21-25)
  {
    id: 21,
    level: "C1",
    type: "gap_fill",
    question:
      "Preoblikujte povedi, a ohranite pomen:\nČeprav ga je opozorila, je vztrajal\n    Navkljub _______ je vztrajal.\nBolje bi bilo, da bi molčal.\n    Moral _______.",
    correctAnswer: "opozorilu,bi molčati",
  },
  {
    id: 22,
    level: "C1",
    type: "multiple_choice",
    question:
      "Preberi odlomek:\n\"V filozofski razpravi o svobodi avtor poudarja, da svoboda ni le odsotnost omejitev, ampak tudi možnost aktivnega sodelovanja v družbi. Svoboda torej pomeni odgovornost.\"\nKako avtor razume svobodo?",
    options: [
      { id: "a", text: "Kot odsotnost odgovornosti." },
      { id: "b", text: "Kot odgovornost in sodelovanje." },
      { id: "c", text: "Kot popolno pomanjkanje pravil." },
    ],
    correctAnswer: "b",
  },
  {
    id: 23,
    level: "C1",
    type: "gap_fill",
    question:
      "Izberi pravilno možnost:\n - To je edina rešitev, _______ (ki/katera) se zdi smiselna.\n - Ni človeka, _______ (ki ne bi/ki ne) kdaj podvomil.\n - Govoril je, _______ (kot da/kot bi) vse vedel.\n - Ne glede na to, _______ (koliko/kolikor) truda vložiš, ni zagotovila.",
    correctAnswer: "ki,ki ne bi,kot bi,koliko",
  },
  {
    id: 24,
    level: "C1",
    type: "multiple_choice",
    question:
      "Preberi odlomek:\n\"Eden od izzivov sodobne družbe je ohranjanje kulturne raznolikosti ob hkratni globalizaciji. Kritiki opozarjajo, da globalizacija vodi v poenotenje kultur, medtem ko zagovorniki trdijo, da omogoča širjenje kulturnih vplivov.\"\nKaj je dilema, ki jo besedilo opisuje?",
    options: [
      { id: "a", text: "Ali globalizacija uničuje ali bogati kulture." },
      { id: "b", text: "Ali globalizacija povečuje cene izdelkov." },
      { id: "c", text: "Ali globalizacija zmanjšuje število potovanj." },
    ],
    correctAnswer: "a",
  },
  {
    id: 25,
    level: "C1",
    type: "gap_fill",
    question:
    "Dopolnite povedi:\na.) Ćeprav je _______ (marsikdo/kdorkoli) dvomil v njegov uspeh, je vztrajal, kot da ga _______ (nič/marsikaj) ne more ustaviti.\nb.) Ne gre za to, da _______ (ne bi/ne) razumel problema, temveč da ga je _______ (marsikje/marsikaj) v sistemu zavajalo.",
    correctAnswer: "marsikdo,nič,ne bi,marsikaj",
  },
];

// Points awarded per correct answer at each difficulty level
export const levelPoints: Record<LanguageLevel, number> = {
  "A0-A1": 1,
  A2: 2,
  B1: 3,
  B2: 4,
  C1: 5,
};

export const maxScore = 75; // 5 questions × (1+2+3+4+5) pts

// Score → assigned level. Thresholds match perfect performance at each tier.
export const scoreThresholds: { minScore: number; level: string }[] = [
  { minScore: 30, level: "B1" },
  { minScore: 15, level: "A2" },
  { minScore: 5,  level: "A1" },
  { minScore: 0,  level: "A0" },
];

export const determineLevelFromScore = (score: number): string =>
  scoreThresholds.find((t) => score >= t.minScore)?.level ?? "A0";

// Level groups for easier access
export const levelGroups = {
  "A0-A1": placementQuestions.slice(0, 5),
  A2: placementQuestions.slice(5, 10),
  B1: placementQuestions.slice(10, 15),
  B2: placementQuestions.slice(15, 20),
  C1: placementQuestions.slice(20, 25),
};

export const levelOrder = ["A0-A1", "A2", "B1", "B2", "C1"] as const;

export type LanguageLevel = (typeof levelOrder)[number];

// Mapping for final level assignment
export const levelMapping: Record<LanguageLevel, string> = {
  "A0-A1": "A1",
  A2: "A2",
  B1: "B1",
  B2: "B1",
  C1: "B1",
};
