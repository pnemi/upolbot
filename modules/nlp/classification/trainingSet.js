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
    class: "GetMyDiplomaThesisInfo",
    sentences: [
      "Zjisti informace o diplomové, bakalářské nebo kvalifikační práci",
      // "Na jaké téma píšu diplomovou, bakalářskou nebo kvalifikační práci?",
      // "Jaká je moje diplomka, bakalářka nebo kvalifikační práce?",
      "Informace o mé diplomové, bakalářské nebo kvalifikační práci"
    ]
  },
  {
    class: "GetStudentDiplomaThesisInfo",
    sentences: [
      "Zjisti informace o diplomové, bakalářské nebo kvalifikační práci",
      "Na jaké téma píše on nebo ona diplomovou, bakalářskou nebo kvalifikační práci?",
      "Jaká je moje diplomka, bakalářka nebo kvalifikační práce?",
      "Informace o diplomové, bakalářské nebo kvalifikační práci studenta",
      "Ona píše práci"
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
  }
];

module.exports = trainingSet;
