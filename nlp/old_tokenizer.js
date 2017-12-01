const RegExp = {
  CZECH_LETTER:     /[a-záéíóúýčďěňřšťžů]+/i,
  LATIN_LETTER:     /[A-z\u00C0-\u00ff]/,
  PUNCTUATION:      /[.,\/#!?$%\^&\*;:{}=\-_`~()]/,
  NUMERIC:          /\d/,
  DATETIME_FORMAT:  /[:\/\.\d]/,
  TIME_DELIMITER:   /[:]/,
  DATE_DELIMITER:   /[\/\.]/,
  WHITESPACE:       /\s/,
};

String.prototype.isType = function (regexp) {
  return regexp.test(this);
};

const isWhitespace = (char) => {
  return WHITESPACE.test(char);
};

const isLetter = (char) => {
  return CZECH_LETTER_REGEX.test(char);
};

const isNumeric = (char) => {
  return NUMERIC_REGEX.test(char);
};

const isDatetimeFormat = (char) => {
  return DATETIME_FORMAT_REGEX.test(char);
};

// TODO: Is it really a delimiter?
const isPunctuation = (char) => {
  return PUNCTUATION.test(char);
};

const tokenize = (text) => {

  let tokens = [];

  for (let i = 0; i < text.length; i++) {

    let token = "";

    let current = text[i];
    let next = text[i + 1];

    // skip white space
    if (current.isType(RegExp.WHITESPACE)) {
      continue;
    }

    // read word
    if (current.isType(RegExp.CZECH_LETTER)) {
      let length = 0; // word length
      while (text.charAt(i + length).isType(RegExp.CZECH_LETTER)) {
        length++;
      }
      token = text.substr(i, length); // extract word sequence
      token = token.toLowerCase(); // lowercase word
      if (!StopwordsSet.has(token)) {
        token = accents.removeAccents(token);
        token = stem(token);
        tokens.push(token);
      }
      i += (length - 1); // shift index position by word's length
      continue;
    }

    if (current.isType(RegExp.NUMERIC)) {
      let length = 1;
      let type = "";
      while (text.charAt(i + length).isType(RegExp.DATETIME_FORMAT)) {
        if (text.charAt(i + length).isType(RegExp.TIME_DELIMITER)) {
          type = "TIME";
        } else if (text.charAt(i + length).isType(RegExp.DATE_DELIMITER)) {
          type = "DATE";
        }
        length++;
      }
      token = text.substr(i, length); // extract word sequence
      i += (length - 1); // shift index position by word's length
      tokens.push(token);
      continue;
    }

  }

  return tokens;

};

const RULES = {
  CZECH_LETTER:     /^[a-záéíóúýčďěňřšťžů]+/i,
  DATE: /^(0?[1-9]|[12][0-9]|3[01])[\.\/] ?(?:(0?[1-9]|1[0-2])[\.\/]|((?:led|úno|bře|dub|kvě|čer|srp|zář|říj|lis|pro)[^\s]*)) ?((?:20)?[0-9]{2})?/i,
  TIME:             /([0-9]{1,2})[:.]?\s*(?:(?:h|hod)[^\s]*)?\s*([0-9]{2})?\s*(?:(?:m|min)[^\s]*)?/,
  // NUMBER:           /\d+/,
  ANYTHING:         /[^\s]*/ // anything until whitespace
  // WHITESPACE: /\s/
};
