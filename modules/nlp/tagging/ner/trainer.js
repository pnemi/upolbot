const
  fs = require("fs"),
  rl = require("readline"),
  stream = require("stream"),
  NERTagger = require("./NERTagger"),
  Entity = require("../Entity");

const ALLOWED_ENTITIES = new Set(Object.values(Entity));

const onlyAllowedTags = tags => {
  return tags.filter(t => ALLOWED_ENTITIES.has(t));
};

const parseCorpus = (corpusFilename, modelFilename) => {
  let instream = fs.createReadStream(corpusFilename);
  let outstream = new stream;
  let sentences = [];
  let sentence = [];
  let hasEntity = false;
  let hasEntityCount = 0;
  let count = 0;
  rl.createInterface(instream, outstream)
    .on("line", line => {
      let l = line.split(/\s+/);
      if (l.length < 3) {
        if (hasEntity) {
          hasEntityCount++;
          sentences.push(sentence);
        }
        count++;
        hasEntity = false;
        sentence = [];
      } else {
        let nerTags = onlyAllowedTags(l.slice(3)).join(",") || "_";
        if (nerTags !== "_") {
          hasEntity = true;
        }
        sentence.push([l[0], nerTags, l[2].slice(0, 2)]);
      }
    })
    .on("close", () => {
      console.log(count, hasEntityCount);
      let tagger = new NERTagger(1);
      tagger.trainModel(sentences, modelFilename, 15);
    });
};

let corpusFilename = "corpus/cnec2.rich.conll";
let modelFilename = "model.json";
parseCorpus(corpusFilename, modelFilename);
