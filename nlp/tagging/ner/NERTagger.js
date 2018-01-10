const
  Perceptron = require("../Perceptron");

const LOWER_WORD = /[a-záéíóúýčďěňřšťžů]+/;
const UPPER_WORD = /[A-ZÁÉÍÓÚÝČĎĚŇŘŠŤŽŮ]+/;
const NUMERIC    = /[0-9]+/;
const NON_WORD   = /\W+/;

class NERTagger extends Perceptron {
  constructor(history = 1) {
    super(history);
  }

  static loadModel(filename = "./model") {
    let tagger = new NERTagger();
    let data = require(filename);
    tagger.weights = data.weights;
    tagger.classes = data.classes;
    return tagger;
  }

  _getWordShape(word) {
    if (LOWER_WORD.test(word)) {
      return "a";
    } else if (UPPER_WORD.test(word)) {
      return "A";
    } else if (NUMERIC.test(word)) {
      return "9";
    } else if (NON_WORD.test(word)) {
      return "-";
    } else {
      return word; // fallback
    }
  }

  _getFeatures(_i, word, ctx) {
    const add = (feat) => {
      if (features[feat]) {
        features[feat] += 1;
      } else {
        features[feat] = 1;
      }
    };

    let i = _i + this.START_CTX.length; // skip beggining of ctx
    let features = {};

    // add(`bias`); // bias acts as an intercept
    add(`pos_prev ${ctx.pos[i - 1]}`);
    add(`ner_prev ${ctx.iob[i - 1]}`);
    add(`w_curr ${word}`);
    add(`wshape ${this._getWordShape(word)}`);
    add(`i_suffix ${word.substr(-2)}`);
    add(`pos_curr ${ctx.pos[i]}`);
    add(`pos_next ${ctx.pos[i + 1]}`);

    return features;
  }

  trainModel(sents, saveTo, nrIters = 5) {
    let wordTags = this._initClasses(sents);

    // let [prev] = this.START_CTX;
    let iter = 1;

    while (iter <= nrIters) {
      let correct = 0; // correctly guessed samples
      let samples = 0; // samples total

      console.log(`Starting iter: ${iter}`);

      sents.forEach(sent => {
        let ctx = {
          pos: ["-PS-", ...sent.map(pair => pair[2]), "-PE-"],
          iob: ["-NS-", ...sent.map(pair => pair[1]), "-NE-"]
        };

        sent.forEach((tuple, i) => {
          let [word, iob] = tuple;

          // word = normalizeWord(word);

          let truth = iob;
          // word POS tag and its features depends on the position in the sentence
          let features = this._getFeatures(i, word, ctx);
          let guess = this._predict(features);
          this._updateModel(truth, guess, features);

          if (guess === truth) {
            correct += 1;
          }
          samples += 1;
        });

      });

      // permute after each iteration to influence convergence rate
      sents = this._shuffleSents(sents);
      console.log(`Iter ${iter}: ${correct} / ${samples} = ${(correct / samples) * 100}%`);

      iter++;
    }

    this._avgWeights();
    this._saveModel(saveTo);

  }

  getEntities(posTags) {
    let tagged = [];

    let ctx = {
      pos: ["-PS-", ...posTags.map(pair => pair[1]), "-PE-"],
      iob: ["-NS-", ...Array(posTags.length).fill(null), "-NE-"]
    };

    posTags.forEach((pair, i) => {
      let [word, pos] = pair;

      let features = this._getFeatures(i, word, ctx);
      let iob = this._predict(features);

      ctx.iob[i + 1] = iob; // update context

      tagged.push([word, pos, iob]);
    });

    return tagged;
  };
}

module.exports = NERTagger;
