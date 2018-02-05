const
  fs = require("fs"),
  rl = require("readline"),
  stream = require("stream"),
  NERTagger = require("./NERTagger");

const parseCorpus = (corpusFilename, modelFilename) => {
  let instream = fs.createReadStream(corpusFilename);
  let outstream = new stream;
  let sentences = [];
  let sentence = [];
  rl.createInterface(instream, outstream)
    .on("line", line => {
      let l = line.split(/\s+/);
      if (l.length < 3) {
        sentences.push(sentence);
        sentence = [];
      } else {
        sentence.push([l[0], l.slice(3).join(",") || "_", l[2].slice(0, 2)]);
      }
    })
    .on("close", () => {
      let tagger = new NERTagger(1);
      tagger.trainModel(sentences, modelFilename, 8);
    });
};

let corpusFilename = "corpus/cnec2.rich.conll";
let modelFilename = "model.json";
parseCorpus(corpusFilename, modelFilename);
