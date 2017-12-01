"use strict";

const
  messenger = require("./messenger"),
  moment = require("moment"),
  db = require("./db"),
  formatter = require("./formatter"),
  stag = require("./stag");

moment.locale("cs"); // cs locales

let stagError = (err) => {
  console.log(err);
  messenger.send({
    text: "Něco se 💩, zkus to prosím znovu. Nezlob se 😕"},
    sender);
};

let dbError = (err) => {
  console.log(err);
  messenger.send({
    text: "Něco se 💩 s databází, zkus to prosím znovu. Nezlob se 😕"},
    sender);
};

exports.greeting = (sender) => {
  messenger.send({text: `Vítá Tě UPOL Asistent!`}, sender);
};

exports.help = (sender) => {

};

exports.thesis = (sender, stag_params) => {

  db.selectStudentWithAuthByPSID(sender)
    .then(student => {

      if (student === "NOT_FOUND") {
        messenger.send(formatter.formatLogin("Požadovaná akce vyžaduje přihlášení"), sender);
      } else {

        let params = {
          "osCislo": stag_params.osCislo || student.stag_number
        };

        stag.request("getKvalifikacniPrace", params)
            .then(res => {
              let theses = res.kvalifikacniPrace;
              if (theses.length > 0) {
                messenger.send(formatter.formatThesis(theses), sender);
              } else {
                messenger.send({text: "Nemáš tu žádnou práci. Pohoda, ne? 😏"}, sender);
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

exports.stagAuth = (sender) => {

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

exports.hey = (sender) => {
  messenger.getUserInfo(sender).then(response => {
    messenger.send({text: `Hello!\nName: ${response.first_name} ${response.last_name}\nGender: ${response.gender.toUpperCase()}\nID: ${sender}`}, sender);
  });
};

exports.weekOddOrEven = (sender) => {
  let weekNumber = moment().isoWeek();
  messenger.send(
    {text: `Je ${(weekNumber % 2 === 0 ? "sudý" : "lichý")} týden`},
    sender);
};
