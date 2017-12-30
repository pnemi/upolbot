const
  TokenType = require("./TokenType");

/**
 * handler: Name of action handlers to invoke after intent classification.
 * query_params: params for related action from input text
 */
const intents = {
  GREETING: {
    handler: "greeting"
    query_params: [] // no
  },
  THANKS: {
    handler: "thanks"
    query_params: [] // no
  },
  WEEK_ODD_EVEN: {
    handler: "weekOddOrEven"
    query_params: [] // no
  },
  DIPLOMA: {
    handler: "diploma"
    query_params: [] // no
  },
  SCHEDULE: {
    handler: "schedule",
    query_params: [
      "date": {
        TokenType.DATE
    ]
  },
  SUBJECT: {
    handler: "subject"
  }
};
