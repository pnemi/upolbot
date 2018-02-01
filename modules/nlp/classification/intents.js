const
  Entity = require("../tagging/Entity");

/**
 * handler: Name of action handlers to invoke after intent classification.
 * query_params: params for related action from input text
 */
const intents = {
  // special intent when no class is found
  "NoMatch": {
    handler: "noMatch"
  },
  "Help": {
    handler: "help"
  },
  "Greet": {
    handler: "greeting"
  },
  "Thanks": {
    handler: "thanks"
  },
  "IsWeekOddOrEven": {
    handler: "weekOddOrEven"
  },
  "GetStudentDiplomaThesisInfo": {
    handler: "thesis",
    entities: {
      "first_name": Entity.FIRST_NAME,
      "last_name": Entity.LAST_NAME
    }
  },
  "GetSchedule": {
    handler: "schedule",
    entities: {
      "day": Entity.TIME
    }
  },
  "GetCourseCompletionInfo": {
    handler: "course"
  },
  "Swearing": {
    handler: "swearing"
  }
};

module.exports = intents;
