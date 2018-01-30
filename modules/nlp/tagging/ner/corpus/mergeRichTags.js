const readline = require('readline');
const fs = require('fs');

let tagged = fs.readFileSync("./cnec2.rich-ner-only.txt", 'utf-8')
               .split('\n');

let conll = fs.readFileSync("./cnec2.pos-only.conll", 'utf-8')
              .split('\n');

let merged = [];
let statistics = {};

for (var i = 0; i < tagged.length; i++) {
  let l1 = tagged[i].split("|")[0];
  let l2 = conll[i].split(/\s+/)[0];
  if (l1 !== l2) {
    console.log(i);
    console.log(tagged[i]);
    console.log(conll[i]);
    console.log("\n");
  }

  let tags = tagged[i].split("|").slice(1);

  // tags.forEach(tag => {
    if (tags in statistics) {
      statistics[tags] += 1;
    } else {
      statistics[tags] = 1;
    }
  // })

  if (tags.length > 0) {
    merged.push(conll[i] + "\t" + tags.join("\t"));
  } else {
    merged.push(conll[i]);
  }
}


function sortObject(obj) {
    var arr = [];
    var prop;
    for (prop in obj) {
        if (obj.hasOwnProperty(prop)) {
            arr.push({
                'key': prop,
                'value': obj[prop]
            });
        }
    }
    arr.sort(function(a, b) {
        return b.value - a.value;
    });
    return arr; // returns array
}

const save = () => {
  fs.writeFile("cnec2.rich.conll", merged.join("\n"), function(err) {
      if(err) {
          return console.log(err);
      }

      console.log("The file was saved!");
  });
}

// console.log(sortObject(statistics));
// save();
