/**
 * Training set for (Multinomial) Naive Bayes intent classification.
 * class: Name of corresponding intent
 */
const trainingSet = [
  {
    class: "Help",
    sentences: [
      "Pomoc",
      "Pomoz mi, prosím",
      "Jaké jsou dostupné příkazy?",
      "Seznam dostupných příkazů",
      "Nevím"
    ]
  },
  {
    class: "Greet",
    sentences: [
      "Ahoj, jak se máš?",
      "Zdravím, jak se daří?",
      "Ahoj",
      "Dobrý den",
      "Čau",
      "Jak to jde?",
      "Zdravím"
    ]
  },
  {
    class: "Thanks",
    sentences: [
      "Děkuji",
      "Díky"
    ]
  },
  {
    class: "IsWeekOddOrEven",
    sentences: [
      "Jaký je týden?",
      "Je sudý týden?",
      "Je lichý týden?",
      "Je tento týden sudý nebo lichý?",
      "Sudý nebo lichý?"
    ]
  },
  {
    class: "GetStudentDiplomaThesisInfo",
    sentences: [
      "Zjisti informace o diplomové, bakalářské nebo kvalifikační práci",
      "Na jaké téma píše diplomovou, bakalářskou nebo kvalifikační práci?",
      "Jaká je diplomka, bakalářka nebo kvalifikační práce?",
      "Informace o diplomové, bakalářské nebo kvalifikační práci"
    ]
  },
  {
    class: "GetSchedule",
    sentences: [
      "Jaký mám dnes rozvrh?",
      "Jaký mám zítra rozvrh hodin?",
      "Ukaž mi rozvrh na zítřejší den"
    ]
  },
  {
    class: "GetCourseCompletionInfo",
    sentences: [
      "Jakým způsobem je předmět zakončen?",
      "Jaké jsou požadavky na splnění předmětu?",
      "Jak uzavřu předmět?",
      "Co je potřeba ke splnění předmětu?",
      "Jaké jsou podmínky pro získání"
    ]
  },
  {
    class: "Swearing",
    sentences: [
      "akcizák", "ambažúra", "babák", "bastard", "bembeřice", "bimbásek", "blbka", "blejt", "bordel", "bordel jak v tanku", "bordelmamá", "brko", "buchta", "buk", "buzerace", "buzerant", "buzerantský", "buzerovat", "buzík", "buzna", "být putna", "chcanec", "chcaní", "chcanky", "chcát", "chcípnout", "chlívák", "chuj", "chujovina", "čokoláda", "čuba", "čubička", "čubka", "čurák", "čúrák", "čůrák", "cyp", "debil", "debilka", "debilní", "dělat si kozy", "dement", "dementka", "díra", "do hajzlu", "do piče", "do piči", "do píči", "do prdele", "dobytek", "drbat", "drek", "dršťka", "drž hubu", "držka", "dutý", "dylina", "flus", "grázl", "hajzl", "hajzlbába", "hajzldědek", "hajzlpapír", "haur", "himlsakra", "hňup", "homokláda", "honit", "hořet koudel u prdele", "hovado", "hovno", "hovnocuc", "huba", "hulibrk", "idiot", "imbecil", "jako kdybys to vytáhl krávě z prdele", "jebačka", "jebat", "kláda", "kokot", "kokotina", "kozomrd", "kretén", "kripl", "ksindl", "kulatina", "kunda", "kunďák", "kuřbuřt", "kurevník", "kurevsky", "kurva", "kurvě", "kurvit", "kurvit se", "kurvítko", "magor", "mindža", "mlít hovna", "mrd", "mrdačka", "mrdat", "mrdka", "mrdlota", "mrdna", "mrdník", "mrdnout", "na hovno", "na pyču", "nasraný", "nasrat", "negr", "obšoustník", "ocas", "ochlasta", "očurávat", "ojebat", "ožrala", "pasák", "pazneht", "péro", "piča", "píča", "píchat", "pičovina", "píčovina", "pičus", "píčus", "pitoma", "pizda", "pochcat", "poser", "posera", "posraný", "posrat", "posrat se", "posrat se v kině", "prcat", "prd", "prdelatý", "prdelka", "prdíček", "prdík", "přefiknout", "prkno", "průser", "pták", "řiťopich", "ser", "šoustat", "spermohlt", "šprcguma", "šprcka", "sráč", "sračka", "sraní", "srát", "srát se", "stát za hovno", "šuk", "šukání", "šulín", "v piči", "viks", "vychcaný", "vyjebat", "vysrat", "zajebaný", "zasraný", "zasrat", "zjebat", "zkurvený", "zkurvit", "zkurvysyn", "zmrd", "zmrdat", "zprcat"
    ]
  }
];

module.exports = trainingSet;
