const
  classify = require("./classification/classifier"),
  intents = require("./classification/intents"),
  extract = require("./tagging/extraction");

const understand = sentence => {
  let response = {};
  response._text = sentence;
  response.intent = classify(sentence, false);
  response.handler = intents[response.intent].handler;
  let intent = intents[response.intent];
  if (true || "entities" in intent) {
    response.entities = extract(sentence, intent.entities);
  }
  response.params = intents[response.intent].params || {};

  return response;
};

module.exports = understand;
