const
  fs = require("fs"),
  rl = require("readline"),
  stream = require("stream");

const parseCorpus = (filename, sep = "|") => {
  let instream = fs.createReadStream(filename);
  let outstream = fs.createWriteStream("corpus/corpus.corp.txt");
  let tagged = [];
  let i = 0;
  let sentence = [];
  let reader = rl.createInterface(instream, outstream);
  reader
    .on("line", line => { // 8918 sentences
      let l = line.split(/\s+/);
      if (l.length !== 3) {
        // end of sentence
        i++;

        outstream.write(sentence.join(" ") + "\n");
        sentence = [];
      } else {

        sentence.push(`${l[0]}|${l[2].slice(0, 2)}|${l[1]}`);
      }
          })
    .on("close", () => {
      outstream.end();
      console.log(i);
      console.log("Dont forget to delete last line!");
    });
};

let filename = "corpus/corpus.conll";
parseCorpus(filename);
