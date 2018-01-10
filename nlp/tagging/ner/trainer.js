const
  fs = require("fs"),
  rl = require("readline"),
  stream = require("stream"),
  NERTagger = require("./NERTagger");

const parseCorpus = (filename, sep = "|") => {
  let instream = fs.createReadStream(filename);
  let outstream = new stream;
  let tagged = [];
  let i = 0;
  rl.createInterface(instream, outstream)
    .on("line", line => {
        tagged.push(line.split(/\s+/)
              .map(token => token.split(sep)));
          })
    .on("close", () => {
      let tagger = new NERTagger(1);
      tagger.trainModel(tagged, "model.json", 8);
    });
};

let filename = "corpus/cnec2.corp.txt";
parseCorpus(filename);
