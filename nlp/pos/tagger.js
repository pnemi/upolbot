const
  corpus = require("./data.js"),
  tokenize = require("../tokenizer").tokenize,
  fs = require('fs'),
  rl = require('readline'),
  stream = require('stream');

/**
 * (Multiclass) Perceptron:
 * Mistake-driven
 * Often no probabilities
 * Discriminative: predicting y directly from x
 * Iterative
 * Accuracy often comparable to more complex algorithms
 * Robust: good accuracy in presence of redundant/irrelevant features
 */

const START = ["-START-", "-START2-"];
const END = ["-END-", "-END2-"];

/*
  Global features vectors (non-averaged weight coeffs).
  Each item represents number of occurences (frequencies) for
  chosen POS tag and history (context).
*/
let weights = {};

/**
 * Cumulative weight coeffs (for calc averaged weights).
 */
let totals = {};

let tagdict = {};
let classes = new Set();
let tstamps = {};
let instances = 0;

const shuffleArray = arr => arr.sort(Math.random() - 0.5);

const parseTagged = (text, sep = "|") => {
  return text.map(sent => {
    return sent.split(/\s+/)
               .map(token => token.split(sep));
  });
};

const makeTagdict = (sents) => {
  let counts = {};
  sents.forEach(sent => {
    sent.forEach(pair => {
      let [word, tag] = pair;

      if (!counts.hasOwnProperty(word)) {
        counts[word] = {};
      }

      if (counts[word].hasOwnProperty(tag)) {
        counts[word][tag] += 1;
      } else {
        counts[word][tag] = 1;
      }

      classes.add(tag)

    });
  });

  // TODO: make dict of frequent word

  // let freqThresh = 20;
  // let ambiguityThresh = 0.97;
  //
  // for (let word of counts) {
  //   let tagFreqs = counts[word];
  //
  // }

};

const isNumeric = str => /^\d+$/.test(str);

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


/**
 * Training HMM (Hidden Markov Models).
 * We want to find a separating hyperplane.
 * 5 to 10 iterations should be sufficient for 100% success.
 * More features are used more iterations are needed.
 * http://ufal.mff.cuni.cz/czech-tagging/VotrubecMSC2005.pdf (4.1.5)
 */
const train = (sents, nrIters = 5) => {
  makeTagdict(sents);

  let [prevPrev, prev] = START;

  while (nrIters-- > 0) {
    let c = 0;
    let n = 0;

    sents.forEach(sent => {
      let ctx = [...START, ...sent.map(pair => normalizeWord(pair[0])), ...END];

      sent.forEach((pair, i) => {
        let [word, tag] = pair;

        let guess = tagdict[word];
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
    console.log(`iter ${nrIters}: ${c} / ${n} = ${pc(c, n)}`);
  }

  avgWeights();

};

// TODO: Filter features with low weights (lower than 3).
// http://ufal.mff.cuni.cz/czech-tagging/VotrubecMSC2005.pdf (4.1.3)

const pc = (n, d) => (parseFloat(n) / d) * 100;

let sents = parseTagged(corpus);
let nrIters = 5;

train(sents, nrIters);

// TODO: Serialize model


// console.log(JSON.stringify(weights));


// tagger


// sent is whole sent
// serves as dictionary for filtered words

/*
  Tagging is like one loop of training (by sentence).
  Model (weight coeffs) is not updated anymore.
  Morphological guesser for known (words with unambiguous tags)
  and unknown data.
*/
const tag = (sent) => {
  let tagged = [];

  let ctx = [...START, ...sent.map(normalizeWord), ...END];

  let [prevPrev, prev] = START;

  sent.forEach((word, i) => {
    let tag = tagdict[word];
    if (!tag) {
      let features = getFeatures(i, word, ctx, prevPrev, prev);
      tag = predict(features);
    }
    tagged.push([word, tag]);
    prev = prevPrev;
    prevPrev = tag;
  });

  console.log(tagged);
};


let text = "Simple is better than complex . Complex is better than complicated .".split(" ");

tag(text);

let filename = "morphodita/morphodita-processed.txt";

const parseCorpus = (filename, sep = "|") => {
  let instream = fs.createReadStream(filename);
  let outstream = new stream;
  let tagged = [];
  rl.createInterface(instream, outstream)
    .on("line", line => {
      tagged.push(line.split(/\s+/)
            .map(token => token.split(sep))); })
    .on("close", () => {
      train(tagged, 8);
      let text = "Moje máma je skvělá kuchařka".split(" ");

      tag(text);
    });
  // return text.map(sent => {
  //   return sent.split(/\s+/)
  //              .map(token => token.split(sep));
  // });
};

// parseCorpus(filename);
