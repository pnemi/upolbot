const
  fs = require("fs"),
  rl = require("readline"),
  stream = require("stream"),
  trainModel = require("./base").trainModel;

const parseCorpus = (filename, trainer, sep = "|") => {
  let instream = fs.createReadStream(filename);
  let outstream = new stream;
  let tagged = [];
  let i = 0;
  rl.createInterface(instream, outstream)
    .on("line", line => {
      // if (i++ % 100 === 0) {
        tagged.push(line.split(/\s+/)
              .map(token => token.split(sep)));
      // }
          })
    .on("close", () => {
      trainer(tagged, 5);
    });
};

let filename = "corpus/cs-web-2014-10k.tagged.txt";
parseCorpus(filename, trainModel);
