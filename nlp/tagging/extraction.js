const
  pos = require("./pos/POSTagger").loadModel(),
  ner = require("./ner/NERTagger").loadModel();

const extract = (sentence, entities) => {
  let posTags = pos.getPartOfSpeech(sentence);
  let nerTags = ner.getEntities(posTags);
  console.log(nerTags);
};

module.exports = extract;
