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

const stagError = err => {
  console.log(err);
  messenger.send({
    text: "Něco se 💩 ve studijní agendě, zkus to prosím znovu. Nezlob se 😕"},
    sender);
};

const dbError = (err) => {
  console.log(err);
  messenger.send({
    text: "Něco se 💩 s databází, zkus to prosím znovu. Nezlob se 😕"},
    sender);
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
  db.selectStudentWithAuthByPSID(sender)
    .then(student => {

      if (student === db.STUDENT_NOT_FOUND) {
        let message = formatter.formatLogin(LOGIN_NEEDED_MSG);
        messenger.send(message, sender);
      } else {
        let stagParams = { "osCislo": student.stag_number };
        reqThesis(sender, stagParams)
      }

    })
    .catch(dbError);
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
          pending.enqueue(options, stagNumbers, "osCislo", "reqThesis", sender);
          multipleMatch(sender, options, optionIndex, "thesis");
        })
        .catch(stagError);
      } else if (students.length === 1) {
        reqThesis(sender, { "osCislo": students[0].osCislo });
      } else {
        messenger.send({text: "Nikoho takové jsem nenašel ☹️"}, sender);
      }
    })
    .catch(stagError);
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








const days = {
  "1": "Pondělí",
  "2": "Úterý",
  "3": "Středa",
  "4": "Čtvrtek",
  "5": "Pátek",
  "6": "Sobota",
  "7": "Neděle",
};

exports.schedule = (sender, stag_params, query_params) => {

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
        messenger.send(formatter.formatLogin("Požadovaná akce vyžaduje přihlášení"), sender);
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
}
