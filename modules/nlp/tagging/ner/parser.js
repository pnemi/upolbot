const
  fs = require("fs"),
  rl = require("readline"),
  stream = require("stream");

const parseCorpus = (filename, sep = "|") => {
  let instream = fs.createReadStream(filename);
  let outstream = fs.createWriteStream("corpus/cnec2.rich.corp.txt");
  // let outstream = fs.createWriteStream("corpus/cnec2.corp.txt");
  let tagged = [];
  let i = 0;
  let sentence = [];
  let reader = rl.createInterface(instream, outstream);
  reader
    .on("line", line => { // 8918 sentences
      let l = line.split(/\s+/);
      if (l.length < 3) {
        // end of sentence
        i++;

        outstream.write(sentence.join(" ") + "\n");
        sentence = [];
      } else {
        sentence.push(`${l[0]}|${l.slice(3).join(",") || "_"}|${l[2].slice(0, 2)}`);
        // sentence.push(`${l[0]}|${l[3]}|${l[2].slice(0, 2)}`);
      }
          })
    .on("close", () => {
      outstream.end();
      console.log(i);
      console.log("Dont forget to delete last line!");
    });
};

let filename = "corpus/cnec2.rich.conll";
// let filename = "corpus/cnec2.conll";
parseCorpus(filename);
