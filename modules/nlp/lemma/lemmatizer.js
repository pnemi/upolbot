const
  fs = require("fs"),
  rl = require("readline"),
  stream = require("stream"),
  path = require('path'),
  PrefixTree = require('prefix-tree');

const lemmas = new PrefixTree();
const FLEXIBLE_POS = new Set(["N", "A", "P", "C", "V"]);

const ALPHA = /^[a-záéíóúýčďěňřšťžů]+$/i;
let readQueue = 2;

const loadLemmasFromCorpus = (filename, sep = "|") => {
  let instream = fs.createReadStream(filename);
  let outstream = new stream;
  let reader = rl.createInterface(instream, outstream);
  reader
    .on("line", line => {
      let l = line.split(/\s+/);
      if (l.length < 3) {
      } else {
        let pos = l[2][0];
        let word = l[0];
        if (FLEXIBLE_POS.has(pos) && ALPHA.test(word)) {
          let lemma = l[1];
          if (word === "prací") {
            // console.log(lemma, pos);
          }
          lemmas.set(`${word}|${pos}`, lemma + pos);
        }
      }
    })
    .on("close", () => {
      readQueue -= 1;

      if (readQueue < 1) {
        console.log(lemmas.get("prací"));
      }
    });
};

const POS_CORPUS = path.resolve(__dirname, "../tagging/pos/corpus/cs-web-2014-10k.conll");
const NER_CORPUS = path.resolve(__dirname, "../tagging/ner/corpus/cnec2.rich.conll");

loadLemmasFromCorpus(POS_CORPUS);
loadLemmasFromCorpus(NER_CORPUS);

module.exports = lemmas;
