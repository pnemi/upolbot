const
  classify = require("./classification/classifier"),
  intents = require("./classification/intents"),
  extract = require("./tagging/extraction");

const understand = sentence => {
  let response = {};
  response._text = sentence;
  response.intent = classify(sentence);
  response.handler = intents[response.intent].handler;
  let intent = intents[response.intent];
  if ("entities" in intent) {
    response.entities = extract(sentence, intent.entities);
  }

  return response;
};

module.exports = understand;
