const
  dice = require("dice-coefficient");

const IS_WORD = /\w+/;

const MONTHS = [
  "Leden",
  "Únor",
  "Březen",
  "Duben",
  "Květen",
  "Červen",
  "Červenec",
  "Srpen",
  "Září",
  "Říjen",
  "Listopad",
  "Prosinec"
];

exports.normalizeTime = response => {
  if (IS_WORD.test(response.entities.month)) {
    let similiarity = MONTHS.map(m => dice(m, response.entities.month));
    response.entities.month = similiarity.indexOf(Math.max(...similiarity)) + 1;
  }
}
