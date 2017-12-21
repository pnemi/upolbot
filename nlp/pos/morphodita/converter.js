const
  fs = require("fs"),
  convert = require("xml-js");


const filename = "morphodita-processed";

const options = {
  compact: true,
  spaces: 2
};

const makeCorpus = (data) => {
  let file = fs.createWriteStream(filename + ".txt");
  data.root.sentence.forEach(item => {
    item.token.forEach((sent, i) => {
      let word = sent._text;
      let tag = sent._attributes.tag;
      file.write(word + "|" + tag);
      if (i < item.token.length - 1) {
        file.write(" "); // next word follows
      } else {
        file.write("\n"); // next sentence follows
      }
    });
  });
  file.end();
};

fs.readFile(filename + ".xml", "utf-8", (err, xml) => {
  xml = "<root>" + xml + "</root>"; // added missing root tag
  let json = convert.xml2json(xml, options);
  let data = JSON.parse(json);
  let corpus = makeCorpus(data);
});
