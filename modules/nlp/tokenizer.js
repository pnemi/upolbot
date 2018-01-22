const
  stem = require('czech-stemmer/light.js'),
  accents = require("./accents"),
  // spell = require("./spell"),
  stopwords = require("./stopwords"),
  Token = require("./Token");

const
  BEG             = "^",
  WS              = "\\s",
  LETTER          = "[a-záéíóúýčďěňřšťžů]",
  NUMERIC         = "[-+]?[0-9]*[\\.,]?[0-9]+",
  PC              = "%",
  PUNCTIATION     = "[.,;:!?\\-–—…„“‚‘»«’()\\[\\]{}〈〉/]",
  ACRONYM         = "(?:[a-záéíóúýčďěňřšťžů]\\.){2,}",
  DATE_DELIM      = "[\.\/]",
  DATE_DD         = "((?:0?[1-9]|[12][0-9]|3[01])\\.)",
  DATE_MM         = "((?:0?[1-9]|1[0-2])\\.)",
  DATE_YYYY       = "(\\s?[0-9]{4})?",
  DATE_MONTH_ABBR = "((?:led|úno|bře|dub|kvě|čer|srp|zář|říj|lis|pro)[^\\s]*)",
  TIME_DELIM      = "[:.]",
  TIME_HH         = "([0-9]{1,2})",
  TIME_MM         = "([0-9]{2})",
  TIME_HOUR       = "([0-9]{1,2})\\s?(?:(?:hodin|hod|h))",
  TIME_MIN        = "([0-9]{2})\\s?(?:(?:minut|min|m))",
  SUBJECT         = "([A-Z]{3})[\s+|\/]([A-Z]{1,}[0-9]*)",
  MATCH_UNTIL_WS  = "[^\\s]*";

const rules = [
  {
    REGEXPS: [
      new RegExp(`${BEG}${ACRONYM}`, "i")
    ],
    TYPE: Token.ACRONYM
  },
  {
    REGEXPS: [
      // eg.
      // 17.4. (2017)
      // 17. 4. (2017)
      // 17/4/(2017)
      new RegExp(`${BEG}${DATE_DD}${DATE_MM}${DATE_YYYY}`),
      // eg.
      // 17.dubna (2017)
      new RegExp(`${BEG}${DATE_DD}${DATE_MONTH_ABBR}${DATE_YYYY}`)
    ],
    TYPE: Token.DATE
  },
  {
    REGEXPS: [
      // eg.
      // 15:36
      // 15.36
      new RegExp(`${BEG}${TIME_HH}${TIME_DELIM}${TIME_MM}`),
      // eg.
      // 15h
      // 15 hod
      // 15 hodin
      new RegExp(`${BEG}${TIME_HOUR}`, "i"),
      // eg.
      // 15h 36m
      // 15 hod 36 min
      // 15 hodin 36 minut
      new RegExp(`${BEG}${TIME_HOUR}${TIME_MIN}`, "i")
    ],
    TYPE: Token.TIME
  },
  {
    REGEXPS: [
      new RegExp(`${BEG}${NUMERIC}${WS}?${PC}?`)
    ],
    TYPE: Token.NUMBER
  },
  {
    REGEXPS: [
      new RegExp(`${BEG}${SUBJECT}`)
    ],
    TYPE: Token.SUBJECT
  },
  {
    REGEXPS: [
      new RegExp(`${BEG}${LETTER}+`, "i")
    ],
    TYPE: Token.WORD
  },
  {
    REGEXPS: [
      new RegExp(`${BEG}${PUNCTIATION}`)
    ],
    TYPE: Token.PUNCTIATION
  },
  {
    REGEXPS: [
      new RegExp(`${MATCH_UNTIL_WS}`)
    ],
    TYPE: Token.UNKNOWN
  }
]


const matchRule = sentence => {
  for (let rule of rules) {
    for (let regexp of rule.REGEXPS) {
      let matches = regexp.exec(sentence);
      if (matches) {
        return {
          matches: matches,
          type: rule.TYPE
        };
      }
    }
  }
  return null;
};

// no lowercase, removing accent, stopwords filtering happen when modify is false
const tokenize = (sentence, reduce = true) => {
  let tokens = [];

  while (sentence.length > 0) {
    sentence = sentence.trim();

    let token = {}; // init token structure
    let match = matchRule(sentence);
    let {type} = match;
    let [text] = match.matches; // whole matched string
    sentence = sentence.substr(text.length, sentence.length);

    // console.log(text, type);

    if (type === Token.WORD && reduce) {
      text = text.toLowerCase();
      tokenNoAcc = accents.remove(text);
      if (!stopwords.has(tokenNoAcc)) {
        text = stem(tokenNoAcc);
      } else {
        continue; // don't push stop word token
      }
    }

    else if (type === Token.SUBJECT) {
      token.department = match.matches[1];
      token.subject = match.matches[2];
    } else if (type === Token.DATE) {
      // tokens.push(match.matches[1] + ".");
      // tokens.push(match.matches[2] + ".");
      // tokens.push(match.matches[3]);
      // token.text = text;
      // token.type = type;
      // continue;
      console.log(match.matches.slice(1));
      tokens.push(...match.matches.slice(1).map(i => ({text: i, type: type})));
      continue;
    }

    if (match.type !== Token.UNKNOWN) {
      token.text = text;
      token.type = type;
      tokens.push(token);
    }
  }

  return tokens;

};

module.exports = tokenize;
