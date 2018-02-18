const
  fs = require("fs"),
  rl = require("readline"),
  stream = require("stream"),
  POSTagger = require("./POSTagger");

const parseCorpus = (corpusFilename, modelFilename) => {
  let instream = fs.createReadStream(corpusFilename);
  let outstream = new stream;
  let sentences = [];
  let sentence = [];
  rl.createInterface(instream, outstream)
    .on("line", line => {
      let l = line.split(/\s+/);
      if (l.length === 3) {
        sentence.push([l[0], l[2].slice(0, 2)]) // without lemma (second col)
      } else {
        // end of sentence
        sentences.push(sentence);
        sentence = [];
      }
    })
    .on("close", () => {
      let tagger = new POSTagger(2);
      tagger.trainModel(sentences, modelFilename, 15);
    });
};

let corpusFilename = "corpus/cs-web-2014-10k.conll";
let modelFilename = "model.json";
parseCorpus(corpusFilename, modelFilename);
