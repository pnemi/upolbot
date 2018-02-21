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
      "Nevím",
      "Co umíš?",
      "Help",
      "nápověda"
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
      "Zjisti informace o diplomové, bakalářské, kvalifikační, závěrečné práci",
      "Na jaké téma píše diplomovou, bakalářskou, kvalifikační, závěrečné práci?",
      "Jaká je diplomka, bakalářka, kvalifikační, závěrečná práce?",
      "Informace o diplomové, bakalářské, kvalifikační, závěrečné práci",
      "Ukaž mi diplomovou, bakalářskou, kvalifikační, závěrečnou práci"
    ]
  },
  {
    class: "GetScheduleOnDate",
    sentences: [
      "Mám být dnes ve škole?",
      "Jaký mám rozvrh?",
      "Jaký rozvrh mám tento",
      "Jaký mám dnes rozvrh?",
      "Jaký mám zítra rozvrh?",
      "Jaký mám rozvrh hodin?",
      "Ukaž mi rozvrh na den"
    ]
  },
  {
    class: "GetSemesterBeginning",
    sentences: [
      "Kdy mi začíná semestr?",
      "Kolikátého mi začíná semestr?",
      "Kdy je začátek semestru?"
    ]
  },
  {
    class: "GetSemesterEnd",
    sentences: [
      "Kdy mi končí semestr?",
      "Kolikátého mi končí semestr?",
      "Kdy je konec semestru?"
    ]
  },
  {
    class: "RemainingCredits",
    sentences: [
      "Jaké mám zbývající studijní povinnosti?",
      "Kolik kreditů musím ještě získat v tomto studiu?",
      "Kolik kreditů zbývá získat v mém studiu?"
    ]
  },
  {
    class: "NumberOfCreditsCurrentSemester",
    sentences: [
      "Kolik získám v tomto semestru kreditů?",
      "Kolik kreditů dostanu ze zapsaných předmětů tento semestr?",
      "Kolik mám kreditů ze předmětů tento semestr?"
    ]
  },
  {
    class: "GetNumberOfExams",
    sentences: [
      "kolik mě čeká zkoušek",
      "Počet zkoušek v aktuálním semestru",
      "Kolik mám tento semestr zkoušek?",
      "Kolik zbývá udělat zkoušek v tomto semestru"
    ]
  },
  {
    class: "GetNumberOfExamsWinterSemester",
    sentences: [
      "Počet zkoušek v zimním semestru",
      "Kolik mám v zimním semestru zkoušek?",
      "Kolik zbývá udělat zkoušek v zimním semestru"
    ]
  },
  {
    class: "GetNumberOfExamsSummerSemester",
    sentences: [
      "Počet zkoušek v letním semestru",
      "Kolik mám v letním semestru zkoušek?",
      "Kolik zbývá udělat zkoušek v letním semestru"
    ]
  },
  {
    class: "IdentifyStudent",
    sentences: [
      "Najdi studenta se jménem"
    ]
  },
  {
    class: "GetExamsDates",
    sentences: [
      "Ukaž mi seznam zkoušek",
      "Jsou nějaké nové termíny zkoušek?",
      "Ukaž mi termíny zkoušek",
      "Jaké jsou moje termíny zkoušek?",
      "Chci se zapsat na zkoušku"
    ]
  },
  {
    class: "GetRegisteredExamsDates",
    sentences: [
      "Ukaž mi seznam zkoušek, na kterých jsem zapsán",
      "Ukaž mi termíny zkoušek, na kterých jsem zapsán",
      "Zkoušky, které mám zapsané",
      "Zkoušky, co jsem si zapsal",
      "Zapsané zkoušky",
      "Odepsat se z termínu"
    ]
  },
  {
    class: "GetBeginningOfTheFirstLessonOfTheDay",
    sentences: [
      "Kdy začíná vyučování?",
      "Kdy mi začíná vyučování?",
      "Začátek vyučování",
      "Kdy začíná první hodina?"
    ]
  },
  {
    class: "GetEndOfTheLastLessonOfTheDay",
    sentences: [
      "Kdy končí vyučování",
      "Kdy mi končí vyučování",
      "Konec vyučování",
      "Kdy končí poslední hodina?"
    ]
  },
  {
    class: "GetTeacherScheduleOnDate",
    sentences: [
      "Jaké předměty dnes vyučuje",
      "Co dnes učí",
      "Jaké předměty dnes vyučuje",
      "Jaké hodiny učí"
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
