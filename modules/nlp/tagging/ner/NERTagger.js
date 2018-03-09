const
  Perceptron = require("../Perceptron");

const LOWER_WORD    = /^[a-záéíóúýčďěňřšťžů]+$/;
const UPPER_WORD    = /^[A-ZÁÉÍÓÚÝČĎĚŇŘŠŤŽŮ]+$/;
const CAPITAL_WORD  = /^[A-ZÁÉÍÓÚÝČĎĚŇŘŠŤŽŮ][a-záéíóúýčďěňřšťžů]+$/;
const NUMERIC       = /^[0-9]+$/;
const NON_WORD      = /^\W+$/;

class NERTagger extends Perceptron {
  constructor(history = 1, weights, classes) {
    super(history, weights, classes);
  }

  static modelLoader() {
    let filename = process.env.NER_MODEL_URL;
    return super.modelLoader(filename);
  }

  _getWordShape(word) {
    if (LOWER_WORD.test(word)) {
      return "a";
    } else if (UPPER_WORD.test(word)) {
      return "A";
    } else if (CAPITAL_WORD.test(word)) {
      return "C";
    } else if (NUMERIC.test(word)) {
      return "9";
    } else if (NON_WORD.test(word)) {
      return "-";
    } else {
      return word; // fallback
    }
  }

  _getFeatures(_i, word, ctx, prevIOB) {
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
    add(`AT ${ctx.pos[i - 1]}`);
    add(`AN ${ctx.iob[i - 1]}`); //
    add(`|W ${word}`);
    // add(`|WS ${this._getWordShape(word)}`);
    add(`|S3 ${word.substr(-3)}`);
    add(`|T ${ctx.pos[i]}`);
    add(`aT ${ctx.pos[i + 1]}`);

    // newly added
    add(`|L ${word.length}`);
    add(`|P1 ${word.substr(0)}`);
    add(`|O ${+(i === 0)}`);
    add(`|U ${+(UPPER_WORD.test(word.charAt(0)))}`);
    add(`|NUM ${+(NUMERIC.test(word))}`);

    return features;
  }

  trainModel(sents, saveTo, nrIters = 5) {
    let wordTags = this._initClasses(sents);

    let [prevIOB] = this.START_CTX;
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
          let features = this._getFeatures(i, word, ctx, prevIOB);
          let guess = this._predict(features);
          this._updateModel(truth, guess, features);

          prevIOB = guess;

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

    let [prevIOB] = this.START_CTX;

    let ctx = {
      pos: ["-PS-", ...posTags.map(pair => pair[1]), "-PE-"],
      iob: ["-NS-", ...Array(posTags.length).fill(null), "-NE-"]
    };

    posTags.forEach((pair, i) => {
      let [word, pos] = pair;

      let features = this._getFeatures(i, word, ctx, prevIOB);
      let guess = this._predict(features);

      prevIOB = guess;

      ctx.iob[i + 1] = guess; // update context

      tagged.push([word, pos, guess.split(",")]);
    });

    return tagged;
  };
}

module.exports = NERTagger;
