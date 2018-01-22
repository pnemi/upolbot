const ngrams = (tokens, n) => {
  if (tokens.length <= 1) {
    return tokens;
  }
  let numOfNGrams = tokens.length - (n - 1);
  let nGrams = Array(numOfNGrams);
  for (let i = n, j = 0; i <= tokens.length; i++, j++) {
    nGrams[j] = tokens.slice(i - n, i).join(" ");
  }
  return nGrams;
};

module.exports = ngrams;
