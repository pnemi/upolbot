const
  dictionary = require("dictionary-cs"),
  nspell = require("nspell");

let spellcheck;

dictionary((err, dict) => {
  if (err) {
    throw err;
  } else {
    spellcheck = nspell(dict);
  }
});

const correct = word => {

};

exports.correct = correct;
