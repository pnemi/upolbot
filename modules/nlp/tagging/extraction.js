const
  tokenize   = require("../tokenizer"),
  // lemmas = require("../lemma/lemmatizer"),
  POSTagger = require("./pos/POSTagger"),
  NERTagger = require("./ner/NERTagger"),
  normalizeTime = require("./timex/normalizer").normalizeTime;

let pos, ner;

const loadModels = whenLoaded => {
  console.log("Loading models");
  Promise
    .all([POSTagger.modelLoader(), NERTagger.modelLoader()])
    .then(models => {
      pos = new POSTagger(2, models[0].weights, models[0].classes);
      ner = new NERTagger(1, models[1].weights, models[1].classes);
      console.log("Models loaded");
      whenLoaded();
    })
    .catch(err => {
      console.error("Error loading models");
      console.log(err);
    })
};

const NER_TAG_INDEX = 2;
const WORD_INDEX = 0;

const extractIOB = (tags, entities) => {
  let extracted = {};

  for (let entity in entities) {
    let type = entities[entity];
    let i = 0;
    while (i < nerTags.length) {
    	if (nerTags[i][2][0] === "B" && nerTags[i][2][2] === type) {
    		let chunk = [nerTags[i][0]];
        i++;
    		while (i < nerTags.length && nerTags[i][2][0] === "I") {
    			chunk.push(nerTags[i][0]);
    			i++;
    		}
    		extracted[entity] = chunk;
    	}
    	i++;
    }
  }
};

const extract = (sentence, entities = {}, intent) => {
  let tokens = tokenize(sentence, false).map(token => token.text);
  let posTags = pos.getPartOfSpeech(tokens);
  let nerTags = ner.getEntities(posTags);

  console.log(nerTags);

  let extracted = {};

  for (let entity in entities) {
    let type = entities[entity];
    for (let i = 0; i < nerTags.length; i++) {
      if (nerTags[i][NER_TAG_INDEX].includes(type)) {
        extracted[entity] = nerTags[i][WORD_INDEX];
        break;
      }
    }
  }

  if (entities.day || entities.month) {
    normalizeTime(extracted, nerTags);
  }

  return extracted;

};

module.exports = extract;
module.exports.loadModels = loadModels;
