"use strict";

const
  messenger = require("./messenger"),
  moment = require("moment"),
  db = require("./db"),
  formatter = require("./formatter"),
  stag = require("./stag"),
  pending = require("./pending");

moment.locale("cs"); // cs locales

String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1).toLowerCase();
}

const GET_AUTH = true;

const LOGIN_NEEDED_MSG = "K tomu potřebuju, aby ses přihlásil 🙂";

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

const isObjEmpty = object => {
  for (let key in object) return false;
  return true;
};

const firstDistinctCol = arr => {
  for (let i = 0; i < arr[0].length; i++) {
    for (let j = 1; j < arr.length; j++) {
      if (arr[j][i] !== arr[0][i]) return [arr.map(item => item[i]), i];
    }
  }
  return [];
};

const stagError = (sender, err) => {
  console.log(err);
  messenger.send({
    text: "Něco se 💩 ve studijní agendě, zkus to prosím znovu. Nezlob se 😕"},
    sender);
};

const dbError = (sender, err) => {
  console.log(err);
  messenger.send({
    text: "Něco se 💩 s databází, zkus to prosím znovu. Nezlob se 😕"},
    sender);
};

const getStagInfo = (sender, cb, auth = false) => {
  let handler = auth ? "selectStudentWithAuthByPSID" : "selectStudentByPSID";
  db[handler](sender)
    .then(response => {

      if (response === db.STUDENT_NOT_FOUND) {
        messenger.send(formatter.formatLogin(LOGIN_NEEDED_MSG), sender);
      } else {
        cb(response);
      }

    })
    .catch(err => dbError(sender, err));
};

const stagRequest = (url, params, cb, auth) => {
  stag.request(url, params, auth)
      .then(cb)
      .catch(err => stagError(sender, err));
};

/**
 * Payload handlers section
 */

// messenger.getUserInfo(sender)
// .then(response => {
//   messenger.send({text: `Hello!\nName: ${response.first_name} ${response.last_name}\nGender: ${response.gender.toUpperCase()}\nID: ${sender}`}, sender);
// });

exports.welcome = sender => {
 messenger.send({text: `Čau, já jsem UPolák 🤓`}, sender);
 exports.help(sender);
};

/**
 * Intents handlers section
 */

exports.identifyStudent = (sender, entities) => {
  let stagParams = {
    "jmeno": encodeURI(entities.first_name || ""),
    "prijmeni": encodeURI(entities.last_name || "")
  };
  stagRequest("najdiStudentyPodleJmena", stagParams, res => {
    let students = res.student;
    if (students.length > 1) {
      console.log(students);

      // jména
      // students.map(s => s.jmeno).filter((elem, pos,arr) => arr.indexOf(elem) == pos);
      // příjmení
      // .map(s => s.jmeno).filter((elem, pos,arr) => arr.indexOf(elem) == pos);
    }
  });
};

exports.noMatch = sender => {
  messenger.send({text: `Já nevím, co tím myslíš 😢`}, sender);
};

exports.help = sender => {
  messenger.send(formatter.formatHelp(`Seznam dostupných příkazů`), sender);
};

exports.greeting = sender => {
  messenger.send({text: `Taky tě zdravím 😜`}, sender);
};

exports.thanks = sender => {
  messenger.send({text: `Není zač 😇`}, sender);
};

exports.weekOddOrEven = sender => {
  let weekNumber = moment().isoWeek();
  messenger.send({
    text: `Je ${(weekNumber % 2 === 0 ? "sudý" : "lichý")} (${weekNumber}.) týden 🧐`},
    sender
  );
};

const myThesis = sender => {
  getStagInfo(sender, info => {
    let stagParams = { "osCislo": info.stag_number };
    reqThesis(sender, stagParams)
  });
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

const studentThesis = (sender, params) => {

  if (!params.first_name || !params.last_name) {
    messenger.send({text: "Budu potřebovat celé jméno 😇"}, sender);
  } else {
    let stagParams = {
      "jmeno": encodeURI(params.first_name),
      "prijmeni": encodeURI(params.last_name)
    };

    stag
      .request("najdiStudentyPodleJmena", stagParams)
      .then(res => {
        let students = res.student;
        if (students.length > 1) {
          Promise.all(
            students.map(s => {
              // get only first study program for identification purposes
              return stag.request("getOborInfo", {"oborIdno": s.oborIdnos.split(",")[0]})
            })
          )
          .then(programs => {
            let matches = programs.map((prog, i) => {
              return [prog.nazev, students[i].rocnik, prog.typ, prog.forma];
            });

            let stagNumbers = students.map(s => s.osCislo);
            let [options, optionIndex] = firstDistinctCol(matches);
            if (!options) {
              options = stagNumbers;
              optionIndex = 4;
            }
            messenger.send(formatter.formatStudents(matches), sender);
            pending.enqueuePostback(stagNumbers, "osCislo", "reqThesis", sender);
            // multipleMatch(sender, options, optionIndex, "thesis");
          })
          .catch(stagError);
        } else if (students.length === 1) {
          reqThesis(sender, { "osCislo": students[0].osCislo });
        } else {
          messenger.send({text: "Nikoho takové jsem nenašel ☹️"}, sender);
        }
      })
      .catch(stagError);
  }
};

const reqThesis = (sender, stagParams) => {
  stag
    .request("getKvalifikacniPrace", stagParams)
    .then(res => {
      let theses = res.kvalifikacniPrace;
      if (theses.length > 0) {
        messenger.send(formatter.formatThesis(theses, "Hodně štěstí s psaním ✊"), sender);
      } else {
        messenger.send({text: "Nemáš tu žádnou práci. Pohoda, ne? 😏"}, sender);
      }

    })
    .catch(stagError);
};

exports.reqThesis = reqThesis;

exports.thesis = (sender, params) => {

  let os
  if (isObjEmpty(params)) {
    myThesis(sender);
  } else {
    studentThesis(sender, params);
  }

};

exports.schedule = (sender, params) => {
  let date;
  if (params.day && params.month) {
    date = `${params.day}.${params.month}.${params.year || moment().year()}`;
  } else {
    date = moment().format("DD.MM.YYYY");
  }

  let stagParams = {
    "datumOd": date,
    "datumDo": date
  };

  getStagInfo(sender, info => {

    stagParams["osCislo"] = info.stag_number;

    stag.request("getRozvrhByStudent", stagParams)
        .then(res => {
          let events = res.rozvrhovaAkce;
          if (events.length === 0) {
            messenger.send({text: "V tento den nemáš školu 😅"}, sender);
          } else {
            messenger.send(formatter.formatSchedule(events), sender);
          }
        })
        .catch(stagError);
  });

};

exports.credits = sender => {
  getStagInfo(sender, info => {
    let stagNumberParam = {"osCislo": info.stag_number};
    let auth = {"user": info.stag_username, "password": info.stag_password };
    stagRequest("getStudentInfo", stagNumberParam, s => {
      stagRequest("getStudijniProgramInfo", {"stprIdno": s.stprIdno}, prog => {
        let numOfCredits = prog.kredity;
        stagRequest("getStudentPredmetyAbsolvoval", {}, marks => {
          let acquiredCredits = marks.predmetAbsolvoval
            .filter(sub => sub.absolvoval === "A")
            .reduce((sum, sub) => { return sum += sub.pocetKreditu }, 0);
          let remainingCredits = numOfCredits - acquiredCredits;
          messenger.send({
            text: `Ještě zbývá získat ${remainingCredits} kreditů ze ${numOfCredits} potřebných 👏`},
            sender);
        }, auth);
      });
    });
  }, GET_AUTH);
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

    stagRequest("getZnamkyByStudent", stagNumberParam, subjects => {
      let numOfExams = subjects.student_na_predmetu
        .filter(s => {
          return s.rok === ROK &&
                 s.semestr === semester &&
                 s.zk_typ_hodnoceni === "Známkou" &&
                 !s.zk_hodnoceni;
        })
        .length;
      let message;
      let beggining;
      if (!params.semester || params.semester === currentSemester) {
        beggining = `V tomto ${SEMESTERS[semester]}`;
      } else {
        if (semester > currentSemester) {
          beggining = `V minulém ${SEMESTERS[semester]}`;
        } else if (semester < currentSemester) {
          beggining = `V dalším ${SEMESTERS[semester]}`;
        }
      }
      if (numOfExams) {
        message = `${beggining} semestru ${getAcademicalYear()} zbývá udělat ${numOfExams} zkoušek 🤓`
      } else {
        message = `${beggining} semestru ${getAcademicalYear()} máš všechny zkoušky hotové 😎`;
      }
      messenger.send({text: message}, sender);
    }, auth);
  }, GET_AUTH);
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
    stagRequest("getTerminyProStudenta", stagNumberParam, res => {
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
        pending.enqueuePostback(datesGroupedBySubject, "dates", handler, sender);
        messenger.send(formatter.formatExamsDates(datesGroupedBySubject, enrolled), sender);
      } else {
        let action = ENROLL_MSG[enrolled];
        messenger.send({text: `Žádný termín k ${action} jsem nenašel 😊`}, sender);
      }
    }, auth);
  }, GET_AUTH);
};

exports.examDates = (sender, params) => {
  pending.enqueuePostback(params.dates, "date", "examDateRegister", sender);
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
      messenger.send({text: message}, sender);
    }, auth);
  }, GET_AUTH);
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





const days = {
  "1": "Pondělí",
  "2": "Úterý",
  "3": "Středa",
  "4": "Čtvrtek",
  "5": "Pátek",
  "6": "Sobota",
  "7": "Neděle",
};

exports.old_schedule = (sender, stag_params, query_params) => {

  let params = {
    "osCislo": "R16988"
  };

  let dayOfWeek;
  let date;
  let msg;

  if (query_params.day) {
    let day = query_params.day.toLowerCase();
    let dayIndex = moment.weekdays(true).indexOf(day) + 1;
    if (dayIndex > 0) {
      if (dayIndex <= moment().isoWeekday()) {
        date = moment().isoWeekday(7 + dayIndex);
        msg = "Rozvrh na příští " + days[date.isoWeekday()].toLowerCase();
      } else {
        date = moment().add(dayIndex - moment().isoWeekday(), "days");
        msg = "Rozvrh na " + days[date.isoWeekday()].toLowerCase();
      }
    } else if (day === "zítra") {
      date = moment().add(1, "days"); // tomorrow
      msg = "Rozvrh na zítřek";
    }
  } else {
    date = moment(); // today
    msg = "Dnešní rozvrh";
  }

  dayOfWeek = days[date.isoWeekday()];

  db.selectStudentWithAuthByPSID(sender)
    .then(student => {

      if (student === "NOT_FOUND") {
        messenger.send(formatter.formatLogin(LOGIN_NEEDED_MSG), sender);
      } else {

      stag.request("getRozvrhByStudent", params)
          .then(res => {

            let week = date.isoWeek() % 2 === 0 ? "Sudý" : "Lichý";
            let events = res.rozvrhovaAkce.filter(event => {
              if (!event.datumOd || !event.datumDo) return false;
              let startDate = moment(event.datumOd.value, "DD.MM.YYYY");
              let endDate = moment(event.datumDo.value, "DD.MM.YYYY");
              return date.isBetween(startDate, endDate, "days", "[]") &&
                     event.den === dayOfWeek &&
                     (event.tyden === "Jiný" || event.tyden === week);
            });

            if (events.length === 0) {
              messenger.send({text: "V tento den nemáš školu 😅"}, sender);
            } else {
              messenger.sendPromise({text: msg}, sender)
                       .then(() => {
                         messenger.send(formatter.formatSchedule(events), sender);
                       })
                       .catch(err => {
                         stagError(err);
                       });
            }

          })
          .catch(err => {
            stagError(err);
          });
    }

  })
  .catch(err => {
    dbError(err);
  });

};


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

exports.stagAuth = sender => {

  db.existsStudentByPSID(sender).then(exists => {
    if (exists) {
      messenger.send(formatter.formatLogout(), sender);
    } else {
      messenger.send(formatter.formatLogin(), sender);
    }
  }).catch(() => {
    messenger.send({text: "Něco se 💩, zkus to prosím znovu. Nezlob se 😕"}, sender);
  });

};

exports.loggedOut = (sender, success) => {
  let message;
  if (success === "YES") {
    message = "Odhlásil jsem tě 👌 Budeš-li se chtít znovu přihlásit, zvol volbu STAG Účet v menu."
  } else {
    message = "Něco se 💩 a nemohl jsem tě odhlásit, zkus to prosím znovu. Sorry 😕"
  }
  messenger.send({text: message}, sender);
};

exports.loggedIn = sender => {
  messenger.send({text: "Byl jsi přihlášen ✌️ Budeš-li se chtít odhlásit, zvol volbu STAG Účet v menu."}, sender);
};

exports.swearing = sender => {
  messenger.send({text: "Prosím, nešlo by to bez těch vulgarit? 🤬"}, sender)
};
