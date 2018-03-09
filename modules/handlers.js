"use strict";

const
  env = require("./env"),
  stem = require('czech-stemmer/light.js'),
  messenger = require("./messenger"),
  moment = require("moment"),
  db = require("./db"),
  formatter = require("./formatter"),
  stag = require("./stag"),
  pending = require("./pending"),
  { reply, formatDate, getTeacherAddressing } = require("./responder"),
  MSG = require("./replies"),
  { vokativ } = require('vokativ'),
  giphy = require('giphy-api')(env.GIPHY_API_KEY);

moment.locale("cs"); // cs datetime locales

/**
 * Error Handling
 */

const stagError = (sender, err) => {
  console.error(err);
  let message;
  if (err === "UNAUTHORIZED") {
    message = reply(MSG.STAG_WRONG_PASSWORD);
  } else {
    message = reply(MSG.STAG_ERR);
  }
  messenger.sendText(message, sender);
};

const dbError = (sender, err) => {
  console.error(err);
  messenger.sendText(reply(MSG.DB_ERR), sender);
};

const messengerError = (sender, err) => {
  console.error(err);
  messenger.sendText(reply(MSG.MESSENGER_ERR), sender);
};

/**
 * Database and STAG API info retrieval callback helpers
 */

const getStagInfo = (sender, cb, auth = false) => {
  let dbHandler = auth ? db.selectStudentWithAuthByPSID : db.selectStudentByPSID;
  dbHandler(sender)
    .then(res => {

      if (res === db.STUDENT_NOT_FOUND) {
        messenger.send(formatter.formatLogin(reply(MSG.LOGIN_NEEDED)), sender);
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
 * Payload handlers
 */

exports.welcome = sender => {
  getVocative(sender, addressing => {
    messenger.sendText(reply(MSG.WELCOME, {addressing}), sender);
    messenger.send(formatter.formatWelcome(), sender);
  });
};

exports.loggedIn = sender => {
  messenger.sendText(reply(MSG.LOGGED_IN), sender);
};

exports.loggedOut = (sender, err) => {
  let message;
  if (!err) {
    message = reply(MSG.LOGGED_OUT);
  } else {
    message = reply(MSG.LOGOUT_ERR);
  }
  messenger.sendText(message, sender);
};

exports.stagAuth = sender => {

  db.existsStudentByPSID(sender)
    .then(exists => {
      if (exists) {
        getStagInfo(sender, info => {
          let stagID = info.stag_number;
          messenger.send(
            formatter.formatLogout(reply(MSG.LOG_OUT, {stagID})),
            sender
          );
        });
      } else {
        messenger.send(formatter.formatLogin(reply(MSG.LOG_IN)), sender);
      }
    })
    .catch(err => {
      console.error(err);
      messenger.sendText(reply(MSG.STAG_AUTH_ERR), sender);
    });
};

exports.help = sender => {
  messenger.send(formatter.formatHelp(reply(MSG.HELP)), sender);
};

exports.upSearch = sender => {
  messenger.send(formatter.formatUPSearch(), sender);
};

/**
 * Identification (student(s) and/or teacher(s)) handlers
 */

 const FILTER_CRITERIA = {
   student: [
     "progNazev",
     "progTyp",
     "progForma",
     "userName"
   ],
   teacher: [
     "katedra",
     "ucitIdno"
   ]
 };

 const joinMultipleSubject = arr => {
   return [
     ...arr.slice(0, arr.length - 2),
     arr.slice(-2).join(" nebo ")
   ].join(", ") + "?";
 };

 const isNameComplete = entities => {
   return entities.first_name && entities.last_name;
 };

 const isNameIncomplete = entities => {
   return (entities.first_name && !entities.last_name) ||
          (!entities.first_name && entities.last_name);
 };

 const noPersonFound = (sender, req) => {
   messenger.sendText(reply(MSG.PERSON_NOT_FOUND), sender);
 };

 const personFound = (sender, req) => {
   let [result] = req.data;

   if (req.params.role === "student") {
     req.stagParams.osCislo = result.osCislo;
   } else if (req.params.role === "teacher") {
     req.stagParams.ucitIdno = result.ucitIdno;
   }

   req.params.person = {
     first_name: result.jmeno,
     last_name: result.prijmeni
   };

   this[req.fullfilledCallback](sender, req);
 };

 const getStudentDetails = (sender, req) => {
   let students = req.data;

   Promise.all(students.map(s => {
     return stag.request("getOborInfo", {"oborIdno": s.oborIdnos});
   }))
   .then(programs => {
     programs.forEach((prog, i) => {
       req.data[i].progNazev = prog.nazev;
       req.data[i].progTyp = prog.typ;
       req.data[i].progForma = prog.forma;
     });
     req.detailsRetrieved = true;
     distinguishPerson(sender, req);
   })
   .catch(err => stagError(sender, err));

 };

 const getTeacherDetails = (sender, req) => {
   let teachers = req.data;

   Promise.all(
     teachers.map(t => {
       return stag.request("getUcitelInfo", {"ucitIdno": t.ucitIdno});
     }))
   .then(info => {
     Promise.all(
       info.map(item => {
         return stag.request("getSeznamPracovist", {"zkratka": item.katedra});
       }))
     .then(workplaces => {
       workplaces.forEach((w, i) => {
         req.data[i].katedra = w.pracoviste[0].nazev || "někde jinde";
       });
       req.detailsRetrieved = true;
       distinguishPerson(sender, req);
     })
     .catch(err => stagError(sender, err));
   })
   .catch(err => stagError(sender, err));
 };

 const distinguishPerson = (sender, req) => {

   let filter, msgPool, detailsHandler;

   if (req.params.role === "student") {
     filter = "osCislo";
     msgPool = "STUDENT_MULTIPLE_MATCH";
     detailsHandler = getStudentDetails;
   } else if (req.params.role === "teacher") {
     filter = "ucitIdno";
     msgPool = "TEACHER_MULTIPLE_MATCH";
     detailsHandler = getTeacherDetails;
   }

   if (req.detailsRetrieved) {

     let criteriaPool = FILTER_CRITERIA[req.params.role];

     // find first unique property to user to pick from
     let criteriaIndex = criteriaPool
       .map((c, i) => {
         return req.data.map(s => {
           return s[criteriaPool[i]];
         }).isUnique()
       })
       .indexOf(true);

     let criteria = criteriaPool[criteriaIndex];

     req.requirement = filter;
     req.options = req.data
       .map(s => {
         return {
           msgKeyword: s[criteria],
           dataFilter: filter,
           param: s[filter]
         }
       });
     let optionMsgs = req.options.map(o => o.msgKeyword);
     let options = joinMultipleSubject(optionMsgs).capitalize();
     pending.enqueueMessage(sender, req);

     let message = reply(MSG[msgPool][criteria], {options});
     messenger.sendText(message, sender);

   } else {
     detailsHandler(sender, req);
   }
 };

 const distinguishRoles = (sender, req) => {

   let {students, teachers} = req.data;

   if (students.length > 0 && teachers.length > 0) {

     // both student(s) and teacher(s) found
     // role need to be distinguished

     req.requirement = "role";
     req.options = [
       {msgKeyword: "student", dataFilter: "students", param: "student"},
       {msgKeyword: "učitel", dataFilter: "teachers", param: "teacher"}
     ];
     pending.enqueueMessage(sender, req);
     messenger.sendText("Myslíš studenta nebo učitele?", sender);

   } else {

     // flatten both student and teacher results into one array
     req.data = [...students, ...teachers];

     if (students.length > 0 && teachers.length === 0) {
       req.params.role = "student";
     } else if (students.length === 0 && teachers.length > 0) {
       req.params.role = "teacher";
     }

     distinguishPersons(sender, req);
   }

 };

 const distinguishPersons = exports.distinguishPersons = (sender, req) => {

   if (req.data.length === 0) {
     noPersonFound(sender, req);
   } else if (req.data.length === 1) {
     personFound(sender, req);
   } else {
     if (req.params.role) {
       if (req.params.role === "student") {
         distinguishPerson(sender, req);
       } else if (req.params.role === "teacher") {
         distinguishPerson(sender, req);
       }
     } else {
       distinguishRoles(sender, req);
     }
   }

 };

 const getRequestAddressesForID = rolesPool => {
   let urls;

   if (rolesPool === "all") {
     urls = [
       "najdiStudentyPodleJmena",
       "najdiUcitelePodleJmena"
     ];
   } else if (rolesPool === "teachers") {
     urls = [
       "najdiUcitelePodleJmena"
     ];
   } else { // student is implicit
     urls = [
       "najdiStudentyPodleJmena"
     ];
   }

   return urls;
 };

 const identifyPerson = exports.identifyPerson = (sender, entities, req, rolesPool) => {
   if (isNameComplete(entities)) {

     let personName = {
       jmeno: encodeURI(stem(entities.first_name)),
       prijmeni: encodeURI(stem(entities.last_name))
     };

     let addresses = getRequestAddressesForID(rolesPool);

     Promise
       .all(addresses.map(a => stag.request(a, personName)))
       .then(res => {

         req.fullfilledCallback = req.handler;
         req.handler = "distinguishPersons";

         if (rolesPool === "all") {

           req.data = {
             students: res[0].student,
             teachers: res[1].ucitel
           };

           distinguishRoles(sender, req);

         } else if (rolesPool === "teachers") {
           req.params.role = "teacher";
           req.data = res[0].ucitel;
           distinguishPersons(sender, req);
         } else {
           req.params.role = "student";
           req.data = res[0].student;
           distinguishPersons(sender, req);
         }
       })
       .catch(err => stagError(sender, err));

   } else if (isNameIncomplete(entities)) {
     // not given full name
     messenger.sendText(reply(MSG.INCOMPLETE_NAME), sender);
   } else {
     // no student name specified
     // will be requested with own personal stag number
     getStagInfo(sender, info => {
       req.params.role = "self";
       req.stagParams.osCislo = info.stag_number;
       this[req.handler](sender, req);
     });
   }
 };

/**
 * Intents handlers
 */

exports.swearing = sender => {
 messenger.sendText(reply(MSG.SWEARING), sender);
 if (Math.random() < 0.5) {
   giphy.random("sad", (err, res) => {
     messenger.send(formatter.formatGIF(res.data), sender);
   });
 }
};

const hasDateEntity = entities => {
  return entities.day && entities.month;
};

const identifyStudent = exports.identifyStudent = (sender, entities, pendingReq) => {

  if (isNameComplete(entities)) {
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
        messenger.sendText("Žádného takového studenta jsem nenašel, sorry ☹️", sender);
      }
    });
  } else if (isNameIncomplete(entities)) {
    // not given full name
    messenger.sendText("Budu potřebovat celé jméno studenta 😇", sender);
  } else {
    // no student name specified
    // will be requested with own personal stag number
    getStagInfo(sender, info => {
      resolveRequest(sender, pendingReq, info.stag_number);
    });
  }
};

const identifyTeacher = exports.identifyTeacher = (sender, entities, pendingReq) => {

  if (isNameComplete(entities)) {
    let name = {};
    name["jmeno"] = encodeURI(stem(entities.first_name));
    name["prijmeni"] = encodeURI(stem(entities.last_name));

    stagRequest(sender, "najdiUcitelePodleJmena", name, res => {
      let teachers = res.ucitel;
      if (teachers.length > 1) {
        Promise.all(
          teachers.map(t => {
            return stag.request("getUcitelInfo", {"ucitIdno": t.ucitIdno});
          })
        )
        .then(teachersInfo => {
          let stagNumbers = teachers.map(t => t.ucitIdno);
          pendingReq.options = stagNumbers;
          pending.enqueuePostback(sender, pendingReq);
          messenger.send(formatter.formatTeachers(teachersInfo), sender);
        })
        .catch(err => stagError(sender, err));

      } else if (teachers.length === 1) {
        resolveRequest(sender, pendingReq, teachers[0][pendingReq.requirement]);
      } else {
        messenger.sendText("Žádného takového učitele jsem nenašel, sorry ☹️", sender);
      }
    });
  } else if (isNameIncomplete(entities)) {
    // not given full name
    messenger.sendText("Budu potřebovat celé jméno učitele 😇", sender);
  } else {
    // no tacher name specified
    messenger.sendText("Budu potřebovat jméno učitele 😇", sender);
  }
};

exports.noMatch = sender => {
  messenger.send(formatter.formatHelp(
    `Já nevím, co tím myslíš 😢\nKoukni na seznam dostupných příkazů 👇`), sender);
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
    messenger.sendText(reply(MSG.GREETING, {addressing}), sender);
  });
};

exports.thanks = sender => {
  messenger.sendText(`Není zač 😇`, sender);
};

exports.headOrTail = sender => {
  var randBool = Math.random() >= 0.5;
  let message = randBool ? "Panna 🙅‍" : "Orel 🦅";
  messenger.sendText(message, sender);
};

exports.weekOddOrEven = sender => {
  let weekNumber = moment().isoWeek();
  messenger.send({
    text: `Je ${(weekNumber % 2 === 0 ? "sudý" : "lichý")} (${weekNumber}.) týden 🧐`},
    sender
  );
};

const reqThesis = exports.reqThesis = (sender, req) => {
  stagRequest(sender, "getKvalifikacniPrace", req.stagParams, res => {
    let theses = res.kvalifikacniPrace;
    req.responseCallback(theses, req);
  });
};

exports.thesis = (sender, entities) => {

  identifyPerson(sender, entities, {
    "params": {},
    "stagParams": {},
    "handler": "reqThesis",
    responseCallback: (theses, req) => {
      let message;
      let role = req.params.role;
      let doesExist = (theses.length > 0 ? "THESIS" : "NO_THESIS");

      if (role === "self") {
        message = reply(MSG[doesExist][role]);
      } else if (role === "student") {
        let name = req.params.person.first_name;
        message = reply(MSG[doesExist][role], {name});
      }

      if (theses.length > 0) {
        messenger.sendTextPromise(message, sender)
          .then(messenger.sendPromise(formatter.formatThesis(theses), sender));
      } else {
        messenger.sendText(message, sender);
      }
    }
  },
  "students");

};

const reqSchedule = exports.reqSchedule = (sender, req) => {
  if (req.params.role === "student" || req.params.role === "self") {
    req.action = "getRozvrhByStudent";
    req.formatterCallback = "formatStudentSchedule";
  } else if (req.params.role === "teacher") {
    req.action = "getRozvrhByUcitel";
    req.formatterCallback = "formatTeacherSchedule";
  }
  stagRequest(sender, req.action, req.stagParams, res => {
    let events = res.rozvrhovaAkce;
    req.responseCallback(events, req);
  });
};

exports.schedule = (sender, entities, params) => {

  let request = {
    "params": {},
    "stagParams": {},
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

  request.responseCallback = (events, req) => {
    if (events.length === 0) {
      let message;
      let role = req.params.role;
      let date = formatDate(dateObj);

      if (role === "self") {
        date = date.capitalize();
        message = reply(MSG.NO_SCHEDULE[role], {date});
      } else {
        if (role === "student") {
          let name = req.params.person.first_name;
          message = reply(MSG.NO_SCHEDULE[role], {date, name});
        } else if (role === "teacher") {
          let addressing = getTeacherAddressing(req.data[0]).capitalize();
          let name = `${addressing} ${req.params.person.last_name}`;

          message = reply(MSG.NO_SCHEDULE[role], {date, name});
        }
      }

      messenger.sendText(message, sender);
    } else {
      messenger.send(formatter[req.formatterCallback](events), sender);
    }
  };

  request.stagParams["datumOd"] = request.stagParams["datumDo"] = dateStr;

  identifyPerson(sender, entities, request, params.rolesPool);

};

exports.nextSemesterBeginning = (sender, entities) => {

  identifyPerson(sender, entities, {
    params: {},
    stagParams: {},
    handler: "reqSchedule",
    responseCallback: (events, req) => {
      let message;
      if (events.length === 0) {
        message = reply(MSG.NO_REGISTERED_SUBJECTS[req.params.role]);
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
          message = reply(MSG.NO_REGISTERED_SUBJECTSD_SUBJECTS[req.params.role]);
        } else {
          let strParams = {}
          strParams.date = formatDate(beginning);
          if (req.params.person) {
            strParams.name = req.params.person.first_name;
          }

          if (beginning.isSameOrBefore(now)) {
            message = reply(MSG.SEMESTER_STARTED[req.params.role], strParams);
          } else {
            message = reply(MSG.SEMESTER_WILL_START[req.params.role], strParams);
          }
        }

        messenger.sendText(message, sender);
      }
    }
  },
  "students");

};

exports.nextSemesterEnd = (sender, entities) => {

  identifyPerson(sender, entities, {
    params: {},
    stagParams: {},
    handler: "reqSchedule",
    responseCallback: (events, req) => {
      let message;
      if (events.length === 0) {
        message = reply(MSG.NO_REGISTERED_SUBJECTS[req.params.role]);
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
          message = reply(MSG.NO_REGISTERED_SUBJECTSD_SUBJECTS[req.params.role]);
        } else {
          let strParams = {}
          strParams.date = formatDate(end);
          if (req.params.person) {
            strParams.name = req.params.person.first_name;
          }
          if (end.isSameOrBefore(now)) {
            message = reply(MSG.SEMESTER_ENDED[req.params.role], strParams);
          } else {
            message = reply(MSG.SEMESTER_WILL_END[req.params.role], strParams);
          }
        }

        messenger.sendText(message, sender);
      }
    }
  },
  "students");

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
            message = reply(MSG.ALL_CREDITS_AQUIRED);
          } else {
            message = reply(MSG.REMAINING_CREDITS, {remainingCredits, numOfCredits});
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
      let credits = marks.predmetAbsolvoval
        .filter(sub => sub.rok === ROK && sub.semestr === currentSemester)
        .reduce((sum, sub) => { return sum += sub.pocetKreditu }, 0);
      messenger.sendText(reply(MSG.CREDITS_TO_AQUIRE, {credits}), sender);
    }, auth);
  }, db.GET_AUTH);
};

const getAcademicalYear = year => {
  return `${year}/${parseInt(year.slice(2)) + 1}`;
};

const SEMESTERS = {
  LS: "letním",
  ZS: "zimním"
};

const numberOfExams = exports.numberOfExams = (sender, entities, params) => {
  getStagInfo(sender, info => {
    let today = moment().format("DD.MM.YYYY");
    stagRequest(sender, "getKalendarRoku", {"datum": today}, calendar => {

      let year = calendar.kalendarItem[0].rokPlatnosti;
      let semestrAbbr = params.semester || calendar.kalendarItem[0].typRozvrhDne;

      let stagNumberParam = {"osCislo": info.stag_number};
      let auth = {"user": info.stag_username, "password": info.stag_password };
      let subjectsParam = {"osCislo": info.stag_number, "semestr": semestrAbbr};

      stagRequest(sender, "getZnamkyByStudent", stagNumberParam, subjects => {
        let numOfExams = subjects.student_na_predmetu
          .filter(s => {
            return s.rok === year &&
                   s.semestr === semestrAbbr &&
                   s.zk_typ_hodnoceni === "Známkou" &&
                   !s.zk_hodnoceni;
          })
          .length;

        let academicalYear = getAcademicalYear(year);
        let semester = SEMESTERS[semestrAbbr];

        let message;

        if (numOfExams) {
          message = reply(MSG.REMAINING_EXAMS, {semester, academicalYear, numOfExams});
        } else {
          message = reply(MSG.ALL_EXAMS_PASSED, {semester, academicalYear});
        }
        messenger.sendText(message, sender);
      }, auth);

    })
  }, db.GET_AUTH);
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
        let msgPool = enrolled ? "NO_EXAM_TO_WITHDRAW" : "NO_EXAM_TO_REGISTER";
        messenger.sendText(reply(MSG[msgPool]), sender);
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
  let msgOK = reply(MSG.EXAM_REGISTER_OK);
  let msgERR = reply(MSG.EXAM_REGISTER_ERR);;
  examTermChange(sender, params.date, "zapisStudentaNaTermin", msgOK, msgERR);
};

exports.examDateWithdraw = (sender, params) => {
  let msgOK = reply(MSG.EXAM_DEREGISTER_OK);
  let msgERR = reply(MSG.EXAM_DEREGISTER_ERR);
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

exports.schoolDayDuration = (sender, entities, params) => {
  let dateStr;
  if (hasDateEntity(entities)) {
    dateStr = getDateStr(entities);
  } else {
    // fallback to today schedule
    dateStr = getTodayDateStr();
  }

  let dateObj = moment(dateStr, "DD.MM.YYYY");

  identifyPerson(sender, entities, {
    params: {},
    stagParams: {
      "datumOd": dateStr,
      "datumDo": dateStr
    },
    handler: "reqSchedule",
    responseCallback: (events, req) => {
      let message;
      let msgPool;
      let strParams = {}
      let role = req.params.role;
      strParams.date = formatDate(dateObj);

      if (req.params.person) {
        strParams.name = req.params.person.first_name;
      } else {
        strParams.date = strParams.date.capitalize();
      }

      if (events.length === 0) {
        msgPool = "NO_SCHEDULE";
      } else {

        if (params.duration === "start") {
          strParams.time = dayBeginningPredicate(events);
          msgPool = "SCHOOL_DAY_START";
        } else if (params.duration === "end") {
          strParams.time = dayEndPredicate(events);
          msgPool = "SCHOOL_DAY_END";
        }

      }

      message = reply(MSG[msgPool][role], strParams);
      messenger.sendText(message, sender);
    }
  },
  "students");

};
