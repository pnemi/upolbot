const
  fs = require("fs");

/**
 * (Multiclass) Perceptron:
 * Mistake-driven
 * Often no probabilities
 * Discriminative: predicting y directly from x
 * Iterative
 * Accuracy often comparable to more complex algorithms
 * Robust: good accuracy in presence of redundant/irrelevant features
 */

/*
  Global features vectors (non-averaged weight coeffs).
  Each item represents number of occurences (frequencies) for
  chosen POS tag and history (context).
*/
let weights = {};

/**
 * Cumulative weight coeffs (for averaged weights calc).
 */
let totals = {};
let tstamps = {};

let unambig = {};
let classes = new Set();

let instances = 0;

const START = ["-S-", "-S2-"];
const END   = ["-E-", "-E2-"];

/**
 * Serializing tagger model.
 */
const saveModel = (filename = "model.json") => {
  let data = JSON.stringify({
    weights: weights,
    unambig: unambig,
    classes: [...classes] // Set => Array
  });
  fs.writeFile(filename, data, (err) => {
    if (err) {
      console.log("Error");
    }
    console.log("Model saved");
  });
};

const loadModel = (filename = "./model") => {
  let data = require(filename);
  weights = data.weights;
  classes = data.classes;
  unambig = data.unambig;
};

const isNumeric = str => /^\d+$/.test(str);

/**
 * Unmabiguous frequent words are stored in separate dictionary.
 */
const initUnambig = wordTags => {
  let freqThresh = 20;
  let ambigThresh = 0.97;

  for (let word in wordTags) {
    let tagFreqs = wordTags[word];
    let maxTag = Object.keys(tagFreqs)
                        .sort((a, b) => tagFreqs[b] - tagFreqs[a])[0];
    let maxTagFreq = tagFreqs[maxTag];
    let sumTagFreqs = Object.values(tagFreqs)
                            .reduce((acc, val) => acc += val);

    if (sumTagFreqs >= freqThresh && (maxTagFreq / sumTagFreqs) >= ambigThresh) {
      unambig[word] = maxTag;
      // console.log(word, maxTag);
    }
  }
};

const initClasses = sentences => {
  let wordTags = {};

  sentences.forEach(sent => {
    sent.forEach(pair => {
      let [word, tag] = pair;

      if (!wordTags.hasOwnProperty(word)) {
        wordTags[word] = {};
      }

      if (wordTags[word].hasOwnProperty(tag)) {
        wordTags[word][tag] += 1;
      } else {
        wordTags[word][tag] = 1;
      }

      // undefined class prevention
      if (!tag) {
        throw new Error("Corpus error in sentence: ", sent);
      }

      classes.add(tag);

    });
  });

  return wordTags;

};

const normalizeWord = (word) => {
  if (word.includes("-") && word[0] !== "-") {
    return "!HYPHEN";
  } else if (isNumeric(word) && word.length === 4) {
    return "!YEAR";
  } else if (isNumeric(word[0])) {
    return "!DIGITS";
  } else {
    return word.toLowerCase();
  }
};

/**
 * Making context from feature set.
 * Feature signature is formed as string (name variable).
 * http://ufal.mff.cuni.cz/czech-tagging/VotrubecMSC2005.pdf (tabulka 4)
 */
const getFeatures = (_i, word, ctx, prevPrev, prev) => {
  const add = (name, ...args) => {
    let feat = [name, ...args].join(" ");
    if (features[feat]) {
      features[feat] += 1;
    } else {
      features[feat] = 1;
    }
  };

  // TODO: Rename feature signatures to something more convenient.

  let i = _i + START.length; // skip beggining of ctx
  let features = {};
  add("bias"); // acts as an intercept
  add("i suffix", word.substr(-3));
  add("i prefix", word[0]);
  add("i-1 tag", prevPrev);
  add("i-2 tag", prev);
  add("i tag+i-2 tag", prevPrev, prev);
  add("i word", ctx[i]);
  add("i-1 tag+i word", prevPrev, ctx[i]);
  add("i-1 word", ctx[i - 1]);
  add("i-1 suffix", ctx[i - 1].substr(-3));
  add("i-2 word", ctx[i - 2]);
  add("i+1 word", ctx[i + 1])
  add("i+1 suffix", ctx[i + 1].substr(-3));
  add("i+2 word", ctx[i + 2]);
  return features;
};

const initClassesScores = () => {
  return [...classes].reduce((scores, clas) => {
    scores[clas] = 0;
    return scores;
  }, {});
};

/**
 * Computing activation.
 * Returns class whose weight vector produces the highest activation.
 * Returns most probable tag.
 */
const predict = (features) => {
  // activation scores for all classes
  let scores = initClassesScores();

  for (let feat in features) {
    let value = features[feat];

    if (!(feat in weights) || value === 0) {
      continue;
    }

    let featWeights = weights[feat];

    for (let label in featWeights) {
      let weight = featWeights[label];
      scores[label] += value * weight;
    }
  }

  let bestClass = Object.keys(scores)
                        .sort() // TODO: Maybe not needed !
                        .reduce((a, b) => scores[a] > scores[b] ? a : b );

  return bestClass;
};

const updateFeatureWeights = (clas, feat, weight = 0, value) => {

  // init structure if not exists
  if (!(feat in totals)) totals[feat] = {};
  if (!(feat in tstamps)) tstamps[feat] = {};
  if (!(totals[feat][clas])) totals[feat][clas] = 0;
  if (!(tstamps[feat][clas])) tstamps[feat][clas] = 0;

  /*

    weight = features weight vector

  */

  totals[feat][clas] += ((instances - tstamps[feat][clas]) * weight);
  tstamps[feat][clas] = instances;
  weights[feat][clas] = weight + value;
};

const updateModel = (truth, guess, features) => {

   instances += 1;

   /*
    Update model (change weight coeffs) if not guessed correctly.
    Increase weight coeff for sentence features and correct tag by 1.
    Decrease weight coeff for sentence features and guessed tag by 1.
    */
   if (truth !== guess) {
     for (let feat in features) {
       if (!(feat in weights)) weights[feat] = {};
       updateFeatureWeights(truth, feat, weights[feat][truth], 1);
       updateFeatureWeights(guess, feat, weights[feat][guess], -1);
     }
   }

};

const getAccValue = (acc, feat, clas) => ((acc[feat] && acc[feat][clas]) || 0);

/**
 * Suppress coefficient oscillations and improves alg success rate.
 * Integer weight vectors are turnt into real vectors (Z => R).
 * Return the average of all versions of the weight vector.
 */
const avgWeights = () => {
  for (let feat in weights) {
    let featWeights = weights[feat];
    let avgFeatWeights = {};
    for (let clas in featWeights) {
      let weight = featWeights[clas];
      let total = getAccValue(totals, feat, clas);
      total += (instances - getAccValue(tstamps, feat, clas)) * weight;
      let avg = (total / instances).toFixed(3);
      if (avg) {
        avgFeatWeights[clas] = avg;
      }
    }
    weights[feat] = avgFeatWeights;
  }
};

const shuffleArray = arr => arr.sort(Math.random() - 0.5);

// TODO: Filter features with low weights (lower than 3).
// http://ufal.mff.cuni.cz/czech-tagging/VotrubecMSC2005.pdf (4.1.3)

/**
 * Training HMM (Hidden Markov Models).
 * We want to find a separating hyperplane.
 * 5 to 10 iterations should be sufficient for 100% success.
 * More features are used more iterations are needed.
 * http://ufal.mff.cuni.cz/czech-tagging/VotrubecMSC2005.pdf (4.1.5)
 */
const trainModel = (sents, nrIters = 5) => {
  let wordTags = initClasses(sents);
  // initUnambig(wordTags);

  let [prevPrev, prev] = START;
  let iter = 0;

  while (iter < nrIters) {
    let c = 0;
    let n = 0;

    console.log(`Starting iter: ${iter}`);

    sents.forEach(sent => {
      let ctx = [...START, ...sent.map(pair => normalizeWord(pair[0])), ...END];

      sent.forEach((pair, i) => {
        let [word, tag] = pair;

        let guess = unambig[word];
        let truth = tag;
        // word POS tag and its features depends on the position in the sentence
        if (!guess) {
          let features = getFeatures(i, word, ctx, prevPrev, prev);
          guess = predict(features);
          updateModel(truth, guess, features);
        }
        prev = prevPrev;
        prevPrev = guess;
        if (guess === truth) {
          c += 1;
        }
        n += 1;
      });

    });

    // permute after each iteration to influence convergence rate
    sents = shuffleArray(sents);
    console.log(`Iter ${iter}: ${c} / ${n} = ${(c / n) * 100}%`);

    iter++;
  }

  avgWeights();
  saveModel();

};


exports.trainModel  = trainModel;
exports.loadModel   = loadModel;
exports.getFeatures   = getFeatures;
exports.predict   = predict;
exports.normalizeWord   = normalizeWord;
exports.START       = START;
exports.END       = END;
exports.unambig     = unambig;
