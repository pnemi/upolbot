"use strict";

const
  env = require("./env");

exports.formatLogin = properties => {
  return {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type": "button",
        "text": "Přihlášení do STAG",
        "buttons":[
          {
            "type":"account_link",
            "url": env.SERVER_URL + "/authorize"
          }
        ]
      }
    }
  };
};

exports.formatLogout = properties => {
  return {
    "attachment":{
      "type":"template",
      "payload":{
        "template_type": "button",
        "text": "Odhlášení ze STAG",
        "buttons":[
          {
            "type":"account_unlink"
          }
        ]
      }
    }
  };
};
