/**
 * Training set for (Multinomial) Naive Bayes intent classification.
 * class: Name of corresponding intent
 */
const trainingSet = [
  {
    class: "GREETING",
    sentences: [
      "Ahoj, jak se máš?",
      "Zdravím, jak se daří?",
      "Ahoj",
      "Dobrý den",
      "Čau",
      "Jak to jde?"
    ]
  },
  {
    class: "THANKS",
    sentences: [
      "Děkuji",
      "Díky"
    ]
  },
  {
    class: "WEEK_ODD_EVEN",
    sentences: [
      "Jaký je týden?",
      "Je sudý týden?",
      "Je lichý týden?"
    ]
  }
];

module.exports = trainingSet;
