const
  tokenize   = require("../tokenizer"),
  // lemmas = require("../lemma/lemmatizer"),
  pos = require("./pos/POSTagger").loadModel(),
  ner = require("./ner/NERTagger").loadModel();

const extract = (sentence, entities) => {
  let tokens = tokenize(sentence, false).map(token => token.text);
  let posTags = pos.getPartOfSpeech(tokens);
  let nerTags = ner.getEntities(posTags);

  console.log(nerTags);

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

  return extracted;

};

module.exports = extract;
