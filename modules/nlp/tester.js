const
  env = require("./../env"),
  understand = require("./understand"),
  loadModels = require("./tagging/extraction").loadModels;

let sentence = "Řekni mi rozvrh Svobody na tento týden";

loadModels(() => {
  console.log(understand(sentence));
});
