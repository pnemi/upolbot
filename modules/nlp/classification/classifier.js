const
  fs = require("fs"),
  tokenize = require("../tokenizer"),
  Token = require("../Token"),
  ngrams = require("./ngrams");

// special class name if no class is matched
const NO_MATCH_CLASS = "NoMatch";

const {classes, corpusWords, classWords} = require("./model");

const calcClassScore = (tokens, className, classWords, corpusWords) => {

  return tokens.reduce((score, token) => {
    if (token in classWords[className]) {
      let commonality = corpusWords[token]; // # of occurs in entire corpus
      // console.log("Match: " + token + " (" + commonality + "x)");
      score += (1 / commonality); // higher commonality means lower score
    }
    return score;
  }, 0);
};

const classify = sentence => {

  // TODO: Assign new words to corpus class when successful matching

  let tokens = tokenize(sentence)
              .filter(token => token.type !== Token.PUNCTIATION)
              .map(token => token.text);

  tokens.concat(ngrams(tokens, 2));

  let scores = {};
  let sum = 0;

  let chosen = classes.reduce((chosen, c) => {
    // add one prior score for cases if no words are matched
    let score = calcClassScore(tokens, c, classWords, corpusWords);
    scores[c] = score;
    sum += score;
    // console.log("Class: " + c + " (" + score + ")\n");
    if (score > chosen.maxScore) {
      chosen.class = c;
      chosen.maxScore = score;
    }
    return chosen;
  }, {maxScore: 0, class: null});

  // TODO: Threshold of score below which there is no match (unable to set via Multinomial Naive Bayes)

  Object.entries(scores)
        .forEach(item => {
          console.log(item[0] + ": " + item[1] / sum * 100);
        });


  return chosen.class || NO_MATCH_CLASS;
}

module.exports = classify;

// TODO: Pouze slova (ne data ani nic jiného)
// Input data is transformed consistently with our training data
// https://chatbotslife.com/text-classification-using-algorithms-e4d50dcba45
