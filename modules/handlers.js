"use strict";

const
  messenger = require("./messenger"),
  moment = require("moment"),
  db = require("./db"),
  formatter = require("./formatter"),
  stag = require("./stag");

exports.greeting = (sender) => {
  messenger.send({text: `Vítá Tě UPOL Asistent!`}, sender);
};

exports.help = (sender) => {
  //messenger.send({text: `Potřebuješ pomoc?`}, sender);
  messenger.send({text:
    "• týden (Je sudý nebo lichý týden?)\n\
    • getStagUserForActualUser\n"
  }, sender);
};

exports.stagAuth = (sender) => {

  db.existsStudentByPSID(sender).then(exists =>{
    if (exists) {
      messenger.send(formatter.formatLogout(), sender);
    } else {
      messenger.send(formatter.formatLogin(), sender);
    }
  }).catch(() => {
    messenger.send({text: "Něco se 💩 a nemohl jsem tě odhlásit, zkus to prosím znovu. Sorry 😕"}, sender);
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

exports.repeat = (sender, values) => {
  messenger.send({text: `Echo: ${values}`}, sender);
};

exports.hey = (sender) => {
  messenger.getUserInfo(sender).then(response => {
    messenger.send({text: `Hello!\nName: ${response.first_name} ${response.last_name}\nGender: ${response.gender.toUpperCase()}\nID: ${sender}`}, sender);
  });
};

exports.weekOddOrEven = (sender) => {
  let weekNumber = moment().isoWeek();
  messenger.send(
    {text: `Je ${(weekNumber % 2 == 0 ? "sudý" : "lichý")} týden`},
    sender);
};
