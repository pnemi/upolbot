const
  getFeatures   = require("./base").getFeatures,
  predict       = require("./base").predict,
  normalizeWord = require("./base").normalizeWord,
  loadModel     = require("./base").loadModel,
  tokenize      = require("../tokenizer"),
  START     = require("./base").START,
  END     = require("./base").END,
  unambig     = require("./base").unambig;

// TODO: serves as dictionary for filtered words

/**
 * Tagging is like one loop of training (by sentence).
 * Model (weight coeffs) is not updated anymore.
 * Morphological guesser for known (words with unambiguous tags)
 * and unknown data.
 * sent: Whole untouched sentence
 */
const tag = sentence => {
  let tagged = [];

  let tokens = tokenize(sentence, false);

  let ctx = [...START, ...tokens.map(normalizeWord), ...END];

  let [prevPrev, prev] = START;

  tokens.forEach((word, i) => {
    let tag = unambig[word];
    if (!tag) {
      let features = getFeatures(i, word, ctx, prevPrev, prev);
      tag = predict(features);
    }
    tagged.push([word, tag]);
    prev = prevPrev;
    prevPrev = tag;
  });

  return tagged;
};

loadModel();

exports.tag = tag;
