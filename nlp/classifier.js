const
  tokenize = require("./tokenizer").tokenize,
  trainingSet = require("./data/trainingSet").trainingSet;

const classes = trainingSet.map(item => item.class);

// TODO: Put trained corpus in db

const calcWordsOccursInSentence = (stats, sentence) => {
  let tokens = tokenize(sentence);
  tokens.forEach(word => {
    if (stats.hasOwnProperty(word) ) {
      stats[word] = stats[word] + 1;
    } else {
      stats[word] = 1;
    }
  });
  return stats;
};

/**
 * returns words for each class
 * @param  {Object} set Set of features
 * @return {Array}     Class words
 */
const getClassWords = (set) => {
  return set.reduce((acc, set) => {
    acc[set.class] = set.sentences.reduce(calcWordsOccursInSentence, {});
    return acc;
  }, {} );
};

/**
 * makes object of all words and its counts in given set
 * @param  {Object} set Set of features
 * @return {Object}     Corpus words and counts
 */
const getCorpusWords = (set) => {
  return set.reduce((stats, feature) => {
    feature.sentences.forEach(sentence => {
      calcWordsOccursInSentence(stats, sentence);
    });
    return stats;
  }, {} );
};

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

let classWords = getClassWords(trainingSet);
let corpusWords = getCorpusWords(trainingSet);

console.log(classWords);

const classify = (sentence) => {

  // TODO: Assign new words to corpus class when successful matching
  // TODO: Keywords will be fetched from db (TOP 10 most occuring)

  let tokenized = tokenize(sentence);
  let chosen = classes.reduce((chosen, c) => {
    let score = calcClassScore(tokenized, c, classWords, corpusWords);
    console.log("Class: " + c + " (" + score + ")\n");
    if (score > chosen.maxScore) {
      chosen.class = c;
    }
    return chosen;
  }, {maxScore: 0, class: null});

  // TODO: Threshold of score below which there is no match (unable to set via Multinomial Naive Bayes)

  return chosen.class;
}

exports.classify = classify;

// TODO: Sentences budou tokenizovány stejnou procedurou, jako uživatelův text
// TODO: Pouze slova (ne data ani nic jiného)
// Input data is transformed consistently with our training data
// https://chatbotslife.com/text-classification-using-algorithms-e4d50dcba45
