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
  "HeadOrTail": {
    handler: "headOrTail"
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
      "first_name": Entity.FIRST_NAME,
      "last_name": Entity.LAST_NAME,
      "day": Entity.DAY,
      "month": Entity.MONTH,
      "year": Entity.YEAR
    },
    params: {
      "rolesPool": "all"
    }
  },
  "GetTeacherSchedule": {
    handler: "schedule",
    entities: {
      "first_name": Entity.FIRST_NAME,
      "last_name": Entity.LAST_NAME,
      "day": Entity.DAY,
      "month": Entity.MONTH,
      "year": Entity.YEAR
    },
    params: {
      "rolesPool": "teachers"
    }
  },
  "GetSemesterBeginning": {
    handler: "nextSemesterBeginning",
    entities: {
      "first_name": Entity.FIRST_NAME,
      "last_name": Entity.LAST_NAME
    }
  },
  "GetSemesterEnd": {
    handler: "nextSemesterEnd",
    entities: {
      "first_name": Entity.FIRST_NAME,
      "last_name": Entity.LAST_NAME
    }
  },
  "RemainingCredits": {
    handler: "remainingCredits"
  },
  "NumberOfCreditsCurrentSemester": {
    handler: "numberOfCreditsCurrentSemester"
  },
  "GetNumberOfExams": {
    handler: "numberOfExams"
  },
  "GetNumberOfExamsWinterSemester": {
    handler: "numberOfExams",
    params: {
      "semester": "ZS"
    }
  },
  "GetNumberOfExamsSummerSemester": {
    handler: "numberOfExams",
    params: {
      "semester": "LS"
    }
  },
  "IdentifyStudent": {
    handler: "identifyStudent",
    entities: {
      "first_name": Entity.FIRST_NAME,
      "last_name": Entity.LAST_NAME
    }
  },
  "GetExamsDates": {
    handler: "examsDates",
    params: {
      "zapsan": false
    }
  },
  "GetRegisteredExamsDates": {
    handler: "examsDates",
    params: {
      "zapsan": true
    }
  },
  "GetBeginningOfTheFirstLessonOfTheDay": {
    handler: "schoolDayDuration",
    entities: {
      "first_name": Entity.FIRST_NAME,
      "last_name": Entity.LAST_NAME,
      "day": Entity.DAY,
      "month": Entity.MONTH,
      "year": Entity.YEAR
    },
    params: {
      "duration": "start"
    }
  },
  "GetEndOfTheLastLessonOfTheDay": {
    handler: "schoolDayDuration",
    entities: {
      "first_name": Entity.FIRST_NAME,
      "last_name": Entity.LAST_NAME,
      "day": Entity.DAY,
      "month": Entity.MONTH,
      "year": Entity.YEAR
    },
    params: {
      "duration": "end"
    }
  },
  "Swearing": {
    handler: "swearing"
  },


  "GetCourseCompletionInfo": {
    handler: "course"
  },

};

module.exports = intents;
