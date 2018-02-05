const
  Token = require("../Token");

const ngrams = (tokens, n) => {
  let nGrams = [];
  if (tokens.length <= 1) {
    return nGrams;
  }
  for (let i = n, j = 0; i <= tokens.length; i++, j++) {
    let candidates = tokens.slice(i - n, i);
    if (candidates.every(c => c.type !== Token.STOPWORD)) {
      nGrams.push(candidates.map(c => c.text).join(" "));
    }
  }
  return nGrams;
};

module.exports = ngrams;
