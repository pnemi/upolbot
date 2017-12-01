const
  accents = require("./accents"),
  dictionary = require('dictionary-cs'),
  nspell = require('nspell'),
  stem = require('czech-stemmer'),
  fs = require("fs"),
  cwd = process.cwd(),
  StopwordsSet = require("./stopwords").StopwordsSet,
  TokenType = require("./TokenType").TokenType,
  intents = require("./intents").intents;

let spellcheck;

// dictionary((err, dict) => {
//   if (err) {
//     throw err;
//   } else {
//     spellcheck = nspell(dict);
//     console.log(spellcheck.wordCharacters());
//   }
// });

const
  BEG =             "^",
  END =             "$",
  WS =              "\\s"
  CZECH_ALPHABET =  "[a-záéíóúýčďěňřšťžů]+",
  DATE_DELIM =      "[\.\/]",
  DATE_DD =         "(0?[1-9]|[12][0-9]|3[01])",
  DATE_MM =         "(0?[1-9]|1[0-2])",
  DATE_YYYY =       "(\\s?[0-9]{4})?",
  DATE_MONTH_ABBR = "((?:led|úno|bře|dub|kvě|čer|srp|zář|říj|lis|pro)[^\\s]*)",
  TIME_DELIM =      "[:.]",
  TIME_HH =         "([0-9]{1,2})",
  TIME_MM =         "([0-9]{2})",
  TIME_HOUR =       "([0-9]{1,2})\\s?(?:(?:hodin|hod|h))",
  TIME_MIN =        "([0-9]{2})\\s?(?:(?:minut|min|m))",
  MATCH_UNTIL_WS =  "[^\\s]*";

const R = {
  WORD: {
    REGEXPS: [
      new RegExp(BEG + CZECH_ALPHABET, "i")
    ],
    TYPE: TokenType.WORD
  },
  TIME: {
    REGEXPS: [
      // eg.
      // 15:36
      // 15.36
      new RegExp(BEG + TIME_HH + TIME_DELIM + TIME_MM),
      // eg.
      // 15h
      // 15 hod
      // 15 hodin
      new RegExp(BEG + TIME_HOUR, "i"),
      // eg.
      // 15h 36m
      // 15 hod 36 min
      // 15 hodin 36 minut
      new RegExp(BEG + TIME_HOUR + TIME_MIN, "i")
    ],
    TYPE: TokenType.TIME
  },
  DATE: {
    REGEXPS: [
      // eg.
      // 17.4. (2017)
      // 17. 4. (2017)
      // 17/4/(2017)
      new RegExp(BEG + DATE_DD + DATE_DELIM + "\\s?" + DATE_MM + DATE_DELIM + DATE_YYYY),
      // eg.
      // 17.dubna (2017)
      new RegExp(BEG + DATE_DD + DATE_DELIM + "\\s?" + DATE_MONTH_ABBR + DATE_YYYY)
    ],
    TYPE: TokenType.DATE
  },
  ANYTHING: {
    REGEXPS: [
      new RegExp(MATCH_UNTIL_WS)
    ],
    TYPE: TokenType.UNKNOWN
  }

}

const matchRule = text => {
  let match;
  for (let rule in R) {
    for (let regexp of R[rule].REGEXPS) {
      match = regexp.exec(text);
      if (match) {
        return {
          matched: match[0],
          index: match.index,
          type: R[rule].TYPE
        };
      }
    }
  }
  return null;
};

const tokenize = (text, spellcheck) => {
  let tokens = [];

  while (text.length > 0) {
    let match, token;
    text = text.trim();
    match = matchRule(text);
    matchedText = match.matched;
    token = text.substr(match.index, matchedText.length);
    text = text.substr(matchedText.length + match.index, text.length);

    if (match.type === TokenType.WORD) {
      token = token.toLowerCase();
      tokenNoAcc = accents.removeAccents(token);
      if (!StopwordsSet.has(tokenNoAcc)) {
        token = stem(tokenNoAcc);
      } else {
        continue; // don't push stop word token
      }
    }

    if (match.type !== TokenType.UNKNOWN) {
      tokens.push(token);
    }
  }

  return tokens;

};

exports.tokenize = tokenize;
