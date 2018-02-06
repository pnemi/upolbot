const
  fs = require("fs"),
  request = require("request");

const IS_URL        = /^http/;

/**
 * (Multiclass) Averaged Perceptron:
 * Mistake-driven
 * Often no probabilities
 * Discriminative: predicting y directly from x
 * Iterative
 * Accuracy often comparable to more complex algorithms
 * Robust: good accuracy in presence of redundant/irrelevant features
 */

class Perceptron {
  constructor(history, weights, classes) {
    if (new.target === Perceptron) {
      throw new TypeError("Cannot construct Perceptron instances directly");
    }

    /*
      Global features vectors (non-averaged weight coeffs).
      Each item represents number of occurences (frequencies) for
      chosen POS tag and history (context).
    */
    this.weights = weights || {};

    /**
     * Cumulative weight coeffs (for averaged weights calc).
     */
    this.totals = {};
    this.tstamps = {};

    /**
     * POS tag in case of POS tagger and IOB tag in case of NER tagger.
     */
    this.classes = classes || new Set();
    this.instances = 0;

    /**
     * HMM start-end-of-sequence history length.
     */
    this.history = history;

    /**
     * Generated start-end-of-sequence tags to use in context creation.
     */
    this.START_CTX = this._genCTXBound("S").reverse();
    this.END_CTX = this._genCTXBound("E");
  }

  _genCTXBound(prefix) {
    return [...Array(this.history).keys()].map(i => `<${prefix}${i}>`);
  }

  _initClasses(sentences) {
    let wordTags = {};

    sentences.forEach(sent => {
      sent.forEach(tuple => {

        // relevant pair always first and second in tuple
        let [word, tag] = tuple;

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
          console.log(sent);
          throw new Error("Corpus error in sentence: ", sent);
        }

        this.classes.add(tag);

      });
    });

    return wordTags;

  }

  /**
   * Loading serialized tagger model.
   */
   static modelLoader(filename) {
     return new Promise((resolve, reject) => {
       fs.readFile(filename, (data, err) => {
         if (IS_URL.test(filename)) {
           request(filename, (err, response, body) => {
             if (err) reject(err);
             if (response.statusCode == 200) {
               let parsed = JSON.parse(body);
               resolve(parsed);
             }
           });
         } else {
           fs.readFile(__dirname + filename, "utf8", (err, data) => {
             if (err) reject(err);
             else {
               let parsed = JSON.parse(data);
               resolve(parsed);
             }
           });
         }
       });
     });
   }

  /**
   * Serializing tagger model.
   */
  _saveModel(filename = "./model") {
    let data = JSON.stringify({
      weights: this.weights,
      classes: [...this.classes] // Set => Array
    });
    fs.writeFile(filename, data, (err) => {
      if (err) {
        console.log("Error");
      }
      console.log("Model saved as: ", filename);
    });
  }

  _getFeatures() {
    throw new Error("Unimplemented features extraction");
  }

  _initClassesScores() {
    return [...this.classes].reduce((scores, clas) => {
      scores[clas] = 0;
      return scores;
    }, {});
  }

  /**
   * Computing activation.
   * Returns class whose weight vector produces the highest activation.
   * Returns most probable tag.
   */
   _predict(features) {
    // activation scores for all classes
    let scores = this._initClassesScores();

    for (let feat in features) {
      let value = features[feat];

      if (!(feat in this.weights) || value === 0) {
        continue;
      }

      let featWeights = this.weights[feat];

      for (let label in featWeights) {
        let weight = featWeights[label];
        scores[label] += value * weight;
      }
    }

    let bestClass = Object.keys(scores)
                          .sort() // TODO: Maybe not needed !
                          .reduce((a, b) => scores[a] > scores[b] ? a : b );

    return bestClass;
  }

  _updateFeatureWeights(clas, feat, weight = 0, value) {

    // init structure if not exists
    if (!(feat in this.totals)) this.totals[feat] = {};
    if (!(feat in this.tstamps)) this.tstamps[feat] = {};
    if (!(this.totals[feat][clas])) this.totals[feat][clas] = 0;
    if (!(this.tstamps[feat][clas])) this.tstamps[feat][clas] = 0;

    this.totals[feat][clas] += ((this.instances - this.tstamps[feat][clas]) * weight);
    this.tstamps[feat][clas] = this.instances;
    this.weights[feat][clas] = weight + value;
  }

  _updateModel(truth, guess, features) {

     this.instances += 1;

     /*
      Update model (change weight coeffs) if not guessed correctly.
      Increase weight coeff for sentence features and correct tag by 1.
      Decrease weight coeff for sentence features and guessed tag by 1.
      */
     if (truth !== guess) {
       for (let feat in features) {
         if (!(feat in this.weights)) this.weights[feat] = {};
         this._updateFeatureWeights(truth, feat, this.weights[feat][truth], 1);
         this._updateFeatureWeights(guess, feat, this.weights[feat][guess], -1);
       }
     }

  }

  _getAccValue (acc, feat, clas) {
    return ((acc[feat] && acc[feat][clas]) || 0);
  }

  /**
   * Suppress coefficient oscillations and improves alg success rate.
   * Integer weight vectors are turnt into real vectors (Z => R).
   * Return the average of all versions of the weight vector.
   */
   _avgWeights() {
    for (let feat in this.weights) {
      let featWeights = this.weights[feat];
      let avgFeatWeights = {};
      for (let clas in featWeights) {
        let weight = featWeights[clas];
        let total = this._getAccValue(this.totals, feat, clas);
        total += (this.instances - this._getAccValue(this.tstamps, feat, clas)) * weight;
        let avg = (total / this.instances).toFixed(3);
        if (avg) {
          avgFeatWeights[clas] = avg;
        }
      }
      this.weights[feat] = avgFeatWeights;
    }
  }

  _shuffleSents(sents) {
    return sents.sort(Math.random() - 0.5);
  }

  // _getContext(tuples) {
  //   return {
  //     words: [...this.START_CTX,
  //             ...sent.map(pair => normalizeWord(pair[0])),
  //             ...this.END_CTX],
  //     pos:   [...this.START_CTX,
  //             ...sent.map(pair => normalizeWord(pair[0])),
  //             ...this.END_CTX]
  //   };
  // }

  // TODO: Filter features with low weights (lower than 3).
  // http://ufal.mff.cuni.cz/czech-tagging/VotrubecMSC2005.pdf (4.1.3)

  /**
   * Training HMM (Hidden Markov Models).
   * We want to find a separating hyperplane.
   * 5 to 10 iterations should be sufficient for 100% success.
   * More features are used more iterations are needed.
   * http://ufal.mff.cuni.cz/czech-tagging/VotrubecMSC2005.pdf (4.1.5)
   */
  trainModel(sents, saveTo, nrIters = 5) {


  };

}

module.exports = Perceptron;
