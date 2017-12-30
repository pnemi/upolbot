const
  fs = require("fs"),
  tokenize = require("../tokenizer");

const {classes, corpusWords, classWords} = require("./model");

const calcClassScore = (tokens, className, classWords, corpusWords) => {

  return tokens.reduce((score, token) => {
    if (token in classWords[className]) {
      let commonality = corpusWords[token]; // # of occurs in entire corpus
      console.log("Match: " + token + " (" + commonality + "x)");
      score += (1 / commonality); // higher commonality means lower score
    }
    return score;
  }, 0);
};

const classify = sentence => {

  // TODO: Assign new words to corpus class when successful matching

  let tokens = tokenize(sentence);

  let chosen = classes.reduce((chosen, c) => {
    let score = calcClassScore(tokens, c, classWords, corpusWords);
    console.log("Class: " + c + " (" + score + ")\n");
    if (score > chosen.maxScore) {
      chosen.class = c;
    }
    return chosen;
  }, {maxScore: 0, class: null});

  // TODO: Threshold of score below which there is no match (unable to set via Multinomial Naive Bayes)

  return chosen.class;
}

module.exports = classify;

// TODO: Sentences budou tokenizovány stejnou procedurou, jako uživatelův text
// TODO: Pouze slova (ne data ani nic jiného)
// Input data is transformed consistently with our training data
// https://chatbotslife.com/text-classification-using-algorithms-e4d50dcba45
