const
  classify = require("./classifier").classify;

let sentence = "Ahoj, je sudý nebo lichý týden?";
console.log("Intent: " + classify(sentence));
