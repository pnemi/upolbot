"use strict";

const
  messenger = require("./messenger"),
  moment = require("moment"),
  formatter = require("./formatter");

exports.greeting = (sender) => {
  messenger.send({text: `Vítá Tě UPOL Asistent!`}, sender);
};

exports.help = (sender) => {
  messenger.send({text: `Potřebuješ pomoc?`}, sender);
};

exports.stagAuth = (sender) => {

  // if not logged in
  // login()
  // else
  // logout()

};

exports.login = (sender) => {
  messenger.send(formatter.formatLogin(), sender);
};

exports.logout = (sender) => {
  messenger.send(formatter.formatLogout(), sender);
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
