const
  fs = require("fs"),
  tokenize = require("../tokenizer"),
  trainingSet = require("./trainingSet");

const calcWordsOccurs = (stats, sentence) => {
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
const getClassWords = set => {
  return set.reduce((acc, set) => {
    acc[set.class] = set.sentences.reduce(calcWordsOccurs, {});
    return acc;
  }, {} );
};

/**
 * makes object of all words and its counts in given set
 * @param  {Object} set Set of features
 * @return {Object}     Corpus words and counts
 */
const getCorpusWords = set => {
  return set.reduce((stats, feature) => {
    feature.sentences.forEach(sentence => {
      calcWordsOccurs(stats, sentence);
    });
    return stats;
  }, {} );
};

const saveModel = (model, filename = "model.json") => {
  let data = JSON.stringify(model);
  fs.writeFile(filename, data, err => {
    if (err) {
      console.log("Error");
    }
    console.log("Classification model saved");
  })
};

// intent classes
const classes = trainingSet.map(item => item.class);

// class words for each class
const classWords = getClassWords(trainingSet);

// whole corpus words and counts
const corpusWords = getCorpusWords(trainingSet);

const model = {
  classes     : classes,
  classWords  : classWords,
  corpusWords : corpusWords
}

saveModel(model);
