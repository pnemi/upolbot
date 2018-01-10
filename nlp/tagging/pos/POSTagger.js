const
  Perceptron = require("../Perceptron"),
  tokenize   = require("../../tokenizer");

class POSTagger extends Perceptron {
  constructor(history = 2) {
    super(history);
  }

  static loadModel(filename = "./model") {
    let tagger = new POSTagger();
    let data = require(filename);
    tagger.weights = data.weights;
    tagger.classes = data.classes;
    return tagger;
  }

  _initUnambig(wordTags) {
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
  }

  _isNumeric(str) {
    return /^\d+$/.test(str);
  }

  _normalizeWord(word) {
    if (word.includes("-") && word[0] !== "-") {
      return "!HYPHEN";
    } else if (this._isNumeric(word) && word.length === 4) {
      return "!YEAR";
    } else if (this._isNumeric(word[0])) {
      return "!DIGITS";
    } else {
      return word.toLowerCase();
    }
  };

  _getFeatures(_i, word, ctx, prevPrev, prev) {
    const add = (feat) => {
      if (features[feat]) {
        features[feat] += 1;
      } else {
        features[feat] = 1;
      }
    };

    let i = _i + this.START_CTX.length; // skip beggining of ctx
    let features = {};

    add(`bias`); // bias acts as an intercept
    add(`i suffix ${word.substr(-3)}`);
    add(`i prefix ${word.charAt(0)}`);
    add(`i-1 tag ${prev}`);
    add(`i-2 tag ${prevPrev}`);
    // add(`i tag+i-2 tag ${prevPrev} ${prev}`); // ??? i-th tag
    add(`i word ${ctx[i]}`); // normalized
    add(`i-1 tag+i word ${prev, ctx[i]}`);
    add(`i-1 word ${ctx[i - 1]}`);
    add(`i-1 suffix ${ctx[i - 1].substr(-3)}`);
    add(`i-2 word ${ctx[i - 2]}`);
    add(`i+1 word ${ctx[i + 1]}`)
    add(`i+1 suffix ${ctx[i + 1].substr(-3)}`);
    add(`i+2 word ${ctx[i + 2]}`);

    return features;
  }

  trainModel(sents, saveTo, nrIters = 5) {
    let wordTags = this._initClasses(sents);
    // initUnambig(wordTags);

    let [prevPrev, prev] = this.START_CTX;
    let iter = 1;

    while (iter <= nrIters) {
      let correct = 0; // correctly guessed samples
      let samples = 0; // samples total

      console.log(`Starting iter: ${iter}`);

      sents.forEach(sent => {
        let ctx = [...this.START_CTX,
                ...sent.map(pair => this._normalizeWord(pair[0])),
                ...this.END_CTX];

        sent.forEach((tuple, i) => {
          let [word, tag] = tuple;

          let truth = tag;
          // tag and its features depends on the position in the sentence
          let features = this._getFeatures(i, word, ctx, prevPrev, prev);
          let guess = this._predict(features);
          this._updateModel(truth, guess, features);

          prev = prevPrev;
          prevPrev = guess;
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

  getPartOfSpeech(sentence) {
    let tagged = [];

    let tokens = tokenize(sentence, false).map(token => token.text);

    let ctx = [...this.START_CTX, ...tokens.map(token => this._normalizeWord(token)), ...this.END_CTX];

    let [prevPrev, prev] = this.START_CTX;

    tokens.forEach((word, i) => {
      let features = this._getFeatures(i, word, ctx, prevPrev, prev);
      let tag = this._predict(features);

      tagged.push([word, tag]);
      prev = prevPrev;
      prevPrev = tag;
    });

    return tagged;
  }

 }

 module.exports = POSTagger;
