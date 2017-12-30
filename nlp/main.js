
let responseFormat = {
  intent: "string", // name of FB or another action handler
  text: "string", // input sentence (untouched)
  // tokens: ["string"],
  params: {
    "param": "value" // parameters for related action
  }
}

const
  classify = require("./classification/classifier"),
  tag      = require("./tagging/tagger").tag,
  tokenize = require("./tokenizer");

const understand = sentence => {
  let response = {};
  // response.intent = classify(sentence);

  console.log(tag(sentence));

  return response;
};

let sentence = "Jaký mám zítra rozvrh?";
// console.log(understand(sentence));

{classes} = require("./tagging/model");
console.log(classes);
