const
  stem = require('czech-stemmer'),
  accents = require("./accents"),
  // spell = require("./spell"),
  stopwords = require("./stopwords"),
  TokenType = require("./TokenType");

const
  BEG             = "^",
  WS              = "\\s",
  LETTER          = "[a-záéíóúýčďěňřšťžů]",
  NUMERIC         = "[-+]?[0-9]*[\\.,]?[0-9]+",
  PC              = "%",
  PUNCTIATION     = "[.,;:!?\\-–—…„“‚‘»«’()\\[\\]{}〈〉/]",
  ACRONYM         = "(?:[a-záéíóúýčďěňřšťžů]\\.){2,}",
  DATE_DELIM      = "[\.\/]",
  DATE_DD         = "(0?[1-9]|[12][0-9]|3[01])",
  DATE_MM         = "(0?[1-9]|1[0-2])",
  DATE_YYYY       = "(\\s?[0-9]{4})?",
  DATE_MONTH_ABBR = "((?:led|úno|bře|dub|kvě|čer|srp|zář|říj|lis|pro)[^\\s]*)",
  TIME_DELIM      = "[:.]",
  TIME_HH         = "([0-9]{1,2})",
  TIME_MM         = "([0-9]{2})",
  TIME_HOUR       = "([0-9]{1,2})\\s?(?:(?:hodin|hod|h))",
  TIME_MIN        = "([0-9]{2})\\s?(?:(?:minut|min|m))",
  MATCH_UNTIL_WS  = "[^\\s]*";

const rules = [
  {
    REGEXPS: [
      new RegExp(`${BEG}${ACRONYM}`, "i")
    ],
    TYPE: TokenType.ACRONYM
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
    TYPE: TokenType.TIME
  },
  {
    REGEXPS: [
      // eg.
      // 17.4. (2017)
      // 17. 4. (2017)
      // 17/4/(2017)
      new RegExp(`${BEG}${DATE_DD}${DATE_DELIM}${WS}?${DATE_MM}${DATE_DELIM}${DATE_YYYY}`),
      // eg.
      // 17.dubna (2017)
      new RegExp(`${BEG}${DATE_DD}${DATE_DELIM}${WS}?${DATE_MONTH_ABBR}${DATE_YYYY}`)
    ],
    TYPE: TokenType.DATE
  },
  {
    REGEXPS: [
      new RegExp(`${BEG}${NUMERIC}${PC}?`)
    ],
    TYPE: TokenType.NUMBER
  },
  {
    REGEXPS: [
      new RegExp(`${BEG}${LETTER}+`, "i")
    ],
    TYPE: TokenType.WORD
  },
  {
    REGEXPS: [
      new RegExp(`${BEG}${PUNCTIATION}`)
    ],
    TYPE: TokenType.PUNCTIATION
  },
  {
    REGEXPS: [
      new RegExp(`${MATCH_UNTIL_WS}`)
    ],
    TYPE: TokenType.UNKNOWN
  }
]


const matchRule = text => {
  for (let rule of rules) {
    for (let regexp of rule.REGEXPS) {
      let matches = regexp.exec(text);
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
const tokenize = (text, reduce = true) => {
  let tokens = [];

  while (text.length > 0) {
    text = text.trim();
    let match = matchRule(text);
    let [token] = match.matches; // whole matched string
    text = text.substr(token.length, text.length);

    // console.log(token , match.type);

    if (match.type === TokenType.WORD && reduce) {
      token = token.toLowerCase();
      tokenNoAcc = accents.remove(token);
      if (!stopwords.has(tokenNoAcc)) {
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

module.exports = tokenize;
