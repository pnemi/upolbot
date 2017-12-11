const
  TokenType = require("./TokenType").TokenType;

exports.intents = [
  {
    name: "greeting"
  },
  {
    name: "thanks"
  },
  {
    name: "weekOddOrEven"
  },
  {
    name: "diploma"
  },
  {
    name: "schedule",
    parameters: {
      "date": TokenType.DATE
    }
  },
  {
    name: "subject"
  }
];
