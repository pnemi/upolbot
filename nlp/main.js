const
  classify = require("./classification/classifier"),
  intents = require("./classification/intents"),
  extract = require("./tagging/extraction");

const understand = sentence => {
  let response = {};
  response._text = sentence;
  response.intent = classify(sentence);
  let entities = intents[response.intent];
  if (entities) {
    response.entities = extract(sentence, entities);
  }

  return response;
};

let sentence = "Jakou bakalářskou práci píše Michaela Smolková?";
console.log(understand(sentence));
