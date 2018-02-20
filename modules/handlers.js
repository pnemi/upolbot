"use strict";

const
  stem = require('czech-stemmer/light.js'),
  messenger = require("./messenger"),
  moment = require("moment"),
  db = require("./db"),
  formatter = require("./formatter"),
  stag = require("./stag"),
  pending = require("./pending"),
  REPLY = require("./replies"),
  { vokativ } = require('vokativ');

moment.locale("cs"); // cs datetime locales

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
};

const replyDate = (dateObj, withWeekday = true) => {
  if (!dateObj) {
    return "dnes";
  }
  let today = moment();
  let daysDiff = dateObj.diff(today, "days");
  if (daysDiff === 0) {
    return "dnes";
  } else if (daysDiff === 1) {
    return "zítra";
  } else if (daysDiff === -1) {
    return "včera";
  } else {
    let formattedDate = dateObj.format("D.M.");
    if (withWeekday) {
      formattedDate = `${REPLY.WEEKDAYS_PREFIX[dateObj.isoWeekday() - 1]} ${formattedDate}`;
    }
    return formattedDate;
  }
};

const stagError = (sender, err) => {
  console.error(err);
  messenger.sendText(
    "Něco se 💩 ve studijní agendě, zkus to prosím znovu. Nezlob se 😕",
    sender
  );
};

const dbError = (sender, err) => {
  console.error(err);
  messenger.sendText(
    "Něco se 💩 s databází, zkus to prosím znovu. Nezlob se 😕",
    sender
  );
};

const messengerError = (sender, err) => {
  console.error(err);
  messenger.sendText(
    "Něco se 💩 V Messengeru, zkus to prosím znovu. Nezlob se 😕",
    sender
  );
};

const getStagInfo = (sender, cb, auth = false) => {
  let dbHandler = auth ? db.selectStudentWithAuthByPSID : db.selectStudentByPSID;
  dbHandler(sender)
    .then(res => {

      if (res === db.STUDENT_NOT_FOUND) {
        messenger.send(formatter.formatLogin(REPLY.LOGIN_NEEDED_MSG), sender);
      } else {
        cb(res);
      }

    })
    .catch(err => dbError(sender, err));
};

const stagRequest = (sender, url, params, cb, auth) => {
  stag.request(url, params, auth)
      .then(cb)
      .catch(err => stagError(sender, err));
};

/**
 * Payload handlers section
 */

exports.welcome = sender => {
  getVocative(sender, addressing => {
    messenger.sendText(`Čau, ${addressing}, já jsem UPolák 🤓`, sender);
    messenger.send(formatter.formatWelcome(), sender);
  });
};

exports.loggedIn = sender => {
  messenger.sendText("Byl jsi přihlášen ✌️ Budeš-li se chtít odhlásit, zvol volbu STAG Účet v menu.", sender);
};

exports.loggedOut = (sender, err) => {
  let message;
  if (!err) {
    message = "Odhlásil jsem tě 👌 Budeš-li se chtít znovu přihlásit, zvol volbu STAG Účet v menu."
  } else {
    message = "Něco se 💩 a nemohl jsem tě odhlásit, zkus to prosím znovu. Sorry 😕"
  }
  messenger.sendText(message, sender);
};

exports.stagAuth = sender => {

  db.existsStudentByPSID(sender).then(exists => {
    if (exists) {
      getStagInfo(sender, info => {
        messenger.send(formatter.formatLogout(info.stag_number), sender)
      });
    } else {
      messenger.send(formatter.formatLogin(), sender);
    }
  }).catch(err => {
    console.error(err);
    messenger.sendText("Něco se 💩 při přihlášení, zkus to prosím znovu. Nezlob se 😕", sender);
  });

};

/**
 * Intents handlers section
 */

 exports.swearing = sender => {
   messenger.sendText("Prosím, nešlo by to bez těch vulgarit? 🤬", sender)
 };

// Resolve request apriori (one student found)
const resolveRequest = (sender, pendingReq, fullfillment) => {
  let requirement = pendingReq.requirement;
  pendingReq.params[requirement] = fullfillment;
  this[pendingReq.handler](sender, pendingReq.params, pendingReq.responseCallback);
};

const hasPersonEntity = entities => {
  return entities.first_name && entities.last_name;
};

const hasDateEntity = entities => {
  return entities.day && entities.month;
};

const isWholeNameGiven = entities => {
  return !entities.first_name || !entities.last_name;
};

const identifyStudent = exports.identifyStudent = (sender, entities, pendingReq) => {

  if (hasPersonEntity(entities)) {
    let name = {};
    name["jmeno"] = encodeURI(stem(entities.first_name));
    name["prijmeni"] = encodeURI(stem(entities.last_name));

    stagRequest(sender, "najdiStudentyPodleJmena", name, res => {
      let students = res.student;
      if (students.length > 1) {
        Promise.all(
          students.map(s => {
            return stag.request("getOborInfo", {"oborIdno": s.oborIdnos});
          })
        )
        .then(programs => {
          let matches = programs.map((prog, i) => {
            return [prog.nazev, students[i].rocnik, prog.typ, prog.forma];
          });
          let stagNumbers = students.map(s => s.osCislo);
          pendingReq.options = stagNumbers;
          pending.enqueuePostback(sender, pendingReq);
          messenger.send(formatter.formatStudents(matches), sender);
        })
        .catch(err => stagError(sender, err));

        // jména
        // students.map(s => s.jmeno).filter((elem, pos,arr) => arr.indexOf(elem) == pos);
        // příjmení
        // .map(s => s.jmeno).filter((elem, pos,arr) => arr.indexOf(elem) == pos);
      } else if (students.length === 1) {
        resolveRequest(sender, pendingReq, students[0][pendingReq.requirement]);
      } else {
        messenger.sendText("Nikoho takové jsem nenašel, sorry ☹️", sender);
      }
    });
  } else if (isWholeNameGiven(entities)) {
    // not given full name
    messenger.sendText("Budu potřebovat celé jméno 😇", sender);
  } else {
    // no student name specified
    // will be requested with own personal stag number
    getStagInfo(sender, info => {
      resolveRequest(sender, pendingReq, info.stag_number);
    });
  }
};

exports.noMatch = sender => {
  messenger.sendText(`Já nevím, co tím myslíš 😢`, sender);
};

exports.help = sender => {
  messenger.send(formatter.formatHelp(`Seznam dostupných příkazů`), sender);
};

exports.upSearch = sender => {
  messenger.send(formatter.formatUPSearch(), sender);
};

const getVocative = (sender, cb) => {
  messenger
    .getUserInfo(sender)
    .then(res => {
      let womanOrNot = res.gender === "female" ? true : false;
      let addressing = vokativ(res.first_name, womanOrNot, false).capitalize();
      cb(addressing);
    })
    .catch(err => messengerError(sender, err));
};

exports.greeting = sender => {
  getVocative(sender, addressing => {
    messenger.sendText(`Taky tě zdravím, ${addressing} 😜`, sender);
  });
};

exports.thanks = sender => {
  messenger.sendText(`Není zač 😇`, sender);
};

exports.weekOddOrEven = sender => {
  let weekNumber = moment().isoWeek();
  messenger.send({
    text: `Je ${(weekNumber % 2 === 0 ? "sudý" : "lichý")} (${weekNumber}.) týden 🧐`},
    sender
  );
};

const reqThesis = exports.reqThesis = (sender, params, cb) => {
  stagRequest(sender, "getKvalifikacniPrace", params, res => {
    let theses = res.kvalifikacniPrace;
    cb(theses);
  });
};

exports.thesis = (sender, entities) => {

  identifyStudent(sender, entities, {
    "params": {},
    "requirement": "osCislo",
    "handler": "reqThesis",
    responseCallback: theses => {
      if (theses.length > 0) {
        messenger.sendTextPromise("Hodně štěstí s psaním ✊", sender)
        .then(messenger.sendPromise(formatter.formatThesis(theses), sender));
      } else {
        messenger.sendText("Nemáš tu žádnou práci. Pohoda, ne? 😏", sender);
      }
    }
  });

};

const reqSchedule = exports.reqSchedule = (sender, params, cb) => {
  stagRequest(sender, "getRozvrhByStudent", params, res => {
    let events = res.rozvrhovaAkce;
    cb(events);
  });
};

exports.dateSchedule = (sender, entities) => {

  let request = {
    "params": {},
    "requirement": "osCislo",
    "handler": "reqSchedule"
  };

  let dateStr;
  if (hasDateEntity(entities)) {
    dateStr = getDateStr(entities);
  } else {
    // fallback to today schedule
    dateStr = getTodayDateStr();
  }

  let dateObj = moment(dateStr, "DD.MM.YYYY");

  request.responseCallback = events => {
    if (events.length === 0) {
      messenger.sendText(`${replyDate(dateObj).capitalize()} nemáš školu 😅`, sender);
    } else {
      messenger.send(formatter.formatSchedule(events), sender);
    }
  };

  request.params["datumOd"] = request.params["datumDo"] = dateStr;

  identifyStudent(sender, entities, request);

};

exports.nextSemesterBeginning = (sender, entities) => {

  identifyStudent(sender, entities, {
    params: {},
    requirement: "osCislo",
    handler: "reqSchedule",
    responseCallback: events => {
      let message;
      if (events.length === 0) {
        message = "Nemáš žádné zapsané předměty 😅";
      } else {
        let now = moment();
        let max = moment("3000", "YYYY");
        let beginning = events
          .filter(item => item.datumOd)
          .reduce((closest, sub) => {
            let subFrom = moment(sub.datumOd.value, "DD.MM.YYYY");
            let subTo = moment(sub.datumDo.value, "DD.MM.YYYY");
            return subFrom.isBefore(closest) && subTo.isAfter(now) ? subFrom : closest;
          }, max);

        // no future event was found
        if (max.isSame(beginning)) {
          message = "Žádný předmět, který máš zapsaný nemá rozvrh 🧐";
        } else if (beginning.isSameOrBefore(now)) {
          message = `Semestr ti začal ${replyDate(beginning)} 🙂`;
        } else {
          message = `Semestr ti začíná ${replyDate(beginning)} 🙂`;
        }

        messenger.sendText(message, sender);
      }
    }
  });

};

exports.nextSemesterEnd = (sender, entities) => {

  identifyStudent(sender, entities, {
    params: {},
    requirement: "osCislo",
    handler: "reqSchedule",
    responseCallback: events => {
      let message;
      if (events.length === 0) {
        message = "Nemáš žádné zapsané předměty 😅";
      } else {
        let now = moment();
        let min = moment("1000", "YYYY");
        let end = events
          .filter(item => item.datumOd)
          .reduce((farthest, sub) => {
            let subTo = moment(sub.datumDo.value, "DD.MM.YYYY");
            return subTo.isAfter(farthest) && subTo.isAfter(now) ? subTo : farthest;
          }, min);

        // no future event was found
        if (min.isSame(end)) {
          message = "Žádný předmět, který máš zapsaný nemá rozvrh 🧐";
        } else if (end.isSameOrBefore(now)) {
          message = `Semestr ti už skončil ${replyDate(end)} 🙂`;
        } else {
          message = `Semestr ti končí ${replyDate(end)} 🙂`;
        }

        messenger.sendText(message, sender);
      }
    }
  });

};

exports.remainingCredits = sender => {
  getStagInfo(sender, info => {
    let stagNumberParam = {"osCislo": info.stag_number};
    let auth = {"user": info.stag_username, "password": info.stag_password };
    stagRequest(sender, "getStudentInfo", stagNumberParam, s => {
      stagRequest(sender, "getStudijniProgramInfo", {"stprIdno": s.stprIdno}, prog => {
        let numOfCredits = prog.kredity;
        stagRequest(sender, "getStudentPredmetyAbsolvoval", {}, marks => {
          let acquiredCredits = marks.predmetAbsolvoval
            .filter(sub => sub.absolvoval === "A")
            .reduce((sum, sub) => { return sum += sub.pocetKreditu }, 0);
          let remainingCredits = numOfCredits - acquiredCredits;
          let message;
          if (remainingCredits === 0) {
            message = `Získal jsi všechny potřebné kredity, gratuluju! 👏`;
          } else {
            message = `Ještě zbývá získat ${remainingCredits} kreditů ze ${numOfCredits} potřebných 👏`;
          }
          messenger.sendText(message, sender);
        }, auth);
      });
    });
  }, db.GET_AUTH);
};

exports.numberOfCreditsCurrentSemester = sender => {
  let currentSemester = getCurrentSemester();
  getStagInfo(sender, info => {
    let stagNumberParam = {"osCislo": info.stag_number};
    let auth = {"user": info.stag_username, "password": info.stag_password };
    stagRequest(sender, "getStudentPredmetyAbsolvoval", {}, marks => {
      let acquiredCredits = marks.predmetAbsolvoval
        .filter(sub => sub.rok === ROK && sub.semestr === currentSemester)
        .reduce((sum, sub) => { return sum += sub.pocetKreditu }, 0);
      messenger.sendText(`Získáš ${acquiredCredits} kreditů ze zapsaných předmětů v tomto semestru`, sender);
    }, auth);
  }, db.GET_AUTH);
};

const SUMMER_SEMESTER = {
  START: moment("1.2.", "D.M."),
  END  : moment("31.8.", "D.M.")
};

const getCurrentSemester = () => {
  if (moment().isBetween(SUMMER_SEMESTER.START, SUMMER_SEMESTER.END)) {
    return "LS";
  } else {
    return "ZS";
  }
};

const ROK = "2017";

const getAcademicalYear = () => {
  return `${ROK}/${parseInt(ROK.slice(2)) + 1}`;
};

const SEMESTERS = {
  LS: "letním",
  ZS: "zimním"
};

const numberOfExams = exports.numberOfExams = (sender, entities, params) => {
  let currentSemester = getCurrentSemester();
  let semester = params.semester || currentSemester;
  getStagInfo(sender, info => {
    let stagNumberParam = {"osCislo": info.stag_number};
    let auth = {"user": info.stag_username, "password": info.stag_password };
    let subjectsParam = {"osCislo": info.stag_number, "semestr": semester};

    // TODO: Na SEMESTR a ROK bude API !

    stagRequest(sender, "getZnamkyByStudent", stagNumberParam, subjects => {
      let numOfExams = subjects.student_na_predmetu
        .filter(s => {
          return s.rok === ROK &&
                 s.semestr === semester &&
                 s.zk_typ_hodnoceni === "Známkou" &&
                 !s.zk_hodnoceni;
        })
        .length;
      let message;
      let beginning;
      if (!params.semester || params.semester === currentSemester) {
        beginning = `V tomto ${SEMESTERS[semester]}`;
      } else {
        if (semester > currentSemester) {
          beginning = `V minulém ${SEMESTERS[semester]}`;
        } else if (semester < currentSemester) {
          beginning = `V dalším ${SEMESTERS[semester]}`;
        }
      }
      if (numOfExams) {
        message = `${beginning} semestru ${getAcademicalYear()} zbývá udělat ${numOfExams} zkoušek 🤓`
      } else {
        message = `${beginning} semestru ${getAcademicalYear()} máš všechny zkoušky hotové 😎`;
      }
      messenger.sendText(message, sender);
    }, auth);
  }, db.GET_AUTH);
};

const ENROLL_MSG = {
  "true": "odepsání",
  "false": "zapsání"
};

exports.examsDates = (sender, entities, params) => {
  let enrolled = ("zapsan" in params && params.zapsan) || false;
  getStagInfo(sender, info => {
    let stagNumberParam = {"osCislo": info.stag_number};
    let auth = {"user": info.stag_username, "password": info.stag_password };
    stagRequest(sender, "getTerminyProStudenta", stagNumberParam, res => {
      let datesGroupedBySubject = res.termin
        .filter(d => {
          return d.zapsan === enrolled && d.lzeZapsatOdepsat;
        })
        .reduce(function (r, a) {
          let key = a.katedra + "/" + a.predmet;
          r[key] = r[key] || [];
          r[key].push(a);
          return r;
        }, {});
      let subjects = Object.keys(datesGroupedBySubject);
      if (subjects.length > 0) {
        let handler = enrolled ? "examDateWithdraw" : "examDates";
        let pendingReq = {
          "options": datesGroupedBySubject,
          "params": {},
          "requirement": "dates",
          "handler": handler
        };
        pending.enqueuePostback(sender, pendingReq);
        messenger.send(formatter.formatExamsDates(datesGroupedBySubject, enrolled), sender);
      } else {
        let action = ENROLL_MSG[enrolled];
        messenger.sendText(`Žádný termín k ${action} jsem nenašel 😊`, sender);
      }
    }, auth);
  }, db.GET_AUTH);
};

exports.examDates = (sender, params) => {
  let request = {
    "options": params.dates,
    "requirement": "date",
    "handler": "examDateRegister"
  };
  pending.enqueuePostback(sender, request);
  messenger.send(formatter.formatExamDates(params.dates), sender);
};

const examTermChange = (sender, term, url, msgOK, msgERR) => {
  getStagInfo(sender, info => {
    let stagParams = {
      "osCislo": info.stag_number,
      "termIdno": term.termIdno
    };
    let auth = {"user": info.stag_username, "password": info.stag_password };
    stagRequest(url, stagParams, res => {
      let message = (res === "OK" ? msgOK : msgERR);
      messenger.sendText(message, sender);
    }, auth);
  }, db.GET_AUTH);
};

exports.examDateRegister = (sender, params) => {
  let msgOK = "Zapsal jsem tě! Hodně štěstí 😉";
  let msgERR = "Nepovedlo se mi tě zapsat, sorry 😭";
  examTermChange(sender, params.date, "zapisStudentaNaTermin", msgOK, msgERR);
};

exports.examDateWithdraw = (sender, params) => {
  let msgOK = "Odhlásil jsem tě z termínu 😉";
  let msgERR = "Nepovedlo se mi tě odhlásit z termínu, sorry 😭";
  // must be first one since student can register only one term
  let date = params.dates[0];
  examTermChange(sender, date, "odhlasStudentaZTerminu", msgOK, msgERR);
};

const sortScheduleByLessonStart = events => {
  return events.sort((a, b) => {
    return moment(a.hodinaSkutOd.value, "HH:mm")
          .diff(moment(b.hodinaSkutOd.value, "HH:mm"));
  });
};

const sortScheduleByLessonEnd = events => {
  return events.sort((a, b) => {
    return moment(a.hodinaSkutDo.value, "HH:mm")
          .diff(moment(b.hodinaSkutDo.value, "HH:mm"));
  });
};

const dayBeginningPredicate = events => {
  let sorted = sortScheduleByLessonStart(events);
  return sorted[0].hodinaSkutOd.value;
};

const dayEndPredicate = events => {
  let sorted = sortScheduleByLessonStart(events);
  return sorted[sorted.length - 1].hodinaSkutDo.value;
};

// parses date from entities
const getDateObj = entities => {
  if (entities.day && entities.month) {
    return moment(getDateStr(entities), "DD.MM.YYYY");
  } else {
    return null;
  }
};

const getTodayDateStr = () => moment().format("DD.MM.YYYY");

const getDateStr = entities => {
  if (entities.day && entities.month) {
    return `${entities.day}.${entities.month}.${entities.year || moment().year()}`;
  } else {
    return null;
  }
};

exports.firstLessonBeginning = (sender, entities) => {

  let dateStr;
  if (hasDateEntity(entities)) {
    dateStr = getDateStr(entities);
  } else {
    // fallback to today schedule
    dateStr = getTodayDateStr();
  }

  let dateObj = moment(dateStr, "DD.MM.YYYY");

  identifyStudent(sender, entities, {
    params: {
      "datumOd": dateStr,
      "datumDo": dateStr
    },
    requirement: "osCislo",
    handler: "reqSchedule",
    responseCallback: events => {
      let message;
      if (events.length === 0) {
        message = `${replyDate(dateObj).capitalize()} nemáš školu 😅`;
      } else {
        let time = dayBeginningPredicate(events);
        message = `První hodina ${replyDate(dateObj)} začíná v ${time} 😩`;
      }
      messenger.sendText(message, sender);
    }
  });

};

exports.lastLessonEnd = (sender, entities) => {

  let dateStr;
  if (hasDateEntity(entities)) {
    dateStr = getDateStr(entities);
  } else {
    // fallback to today schedule
    dateStr = getTodayDateStr();
  }

  let dateObj = moment(dateStr, "DD.MM.YYYY");

  identifyStudent(sender, entities, {
    params: {
      "datumOd": dateStr,
      "datumDo": dateStr
    },
    requirement: "osCislo",
    handler: "reqSchedule",
    responseCallback: events => {
      let message;
      if (events.length === 0) {
        message = `${replyDate(dateObj).capitalize()} nemáš školu 😅`;
      } else {
        let time = dayEndPredicate(events);
        message = `Poslední hodina ${replyDate(dateObj)} končí v ${time} 😩`;
      }
      messenger.sendText(message, sender);
    }
  });

};











/**
 * OLD
 */


exports.subject = (sender, stag_params) => {

  let params = {
    katedra: stag_params.katedra,
    zkratka: stag_params.zkratka
  };

  stag.request("getPredmetInfo", params)
      .then(res => {

        let props = res.predmetInfo;

        messenger.send(formatter.formatSubject(props), sender);

      })
      .catch(err => {
        stagError(err);
      });

};

const MULTIPLE_MATCH_QUESTION = [
  [
    "Jaký",
    "Jakou",
    "Jaké"
  ],
  [
    "studuje",
    "má"
  ],
  [
    "obor",
    "ročník",
    "typ studia",
    "formu",
    "osobní číslo"
  ]
];

const MULTIPLE_MATCH_DISTINCT = {
  thesis: [
    [0, 0, 0], [0, 0, 1], [0, 0, 2], [1, 0, 3], [2, 1, 4]
  ]
};

const firstDistinctCol = arr => {
  for (let i = 0; i < arr[0].length; i++) {
    for (let j = 1; j < arr.length; j++) {
      if (arr[j][i] !== arr[0][i]) return [arr.map(item => item[i]), i];
    }
  }
  return [];
};

const joinMultipleSubject = arr => {
  return [
    ...arr.slice(0, arr.length - 2),
    arr.slice(-2).join(" nebo ")
  ].join(", ")
};

const multipleMatch = (sender, opts, i, intent) => {
  let question = MULTIPLE_MATCH_DISTINCT[intent][i]
    .map((val, i) => MULTIPLE_MATCH_QUESTION[i][val])
    .join(" ")
  messenger.send({
    text: `${question}? ${joinMultipleSubject(opts).capitalize()}? 🤔`
  }, sender);
};
