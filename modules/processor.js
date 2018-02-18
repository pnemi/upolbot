"use strict";

const HANDLERS = {
  "login": "login",
  "logout": "logout",
  "týden": "weekOddOrEven",
  "práce": "thesis",
  "rozvrh": "schedule",
  "predmet": "subject"
};

let match = text => {

  let split = text.split(" ");
  let handler = split.shift().toLowerCase();
  let values = split;

  let result = {
    handler: HANDLERS[handler],
    values: values
  };

  return result;

};

const PAYLOADS = {
  GREETING_PAYLOAD: "welcome",
  HELP_PAYLOAD: "help",
  STAG_AUTH_PAYLOAD: "stagAuth",
  UPSEARCH_PAYLOAD: "upSearch"
};

let matchPayload = payload => {

  let handler = PAYLOADS[payload];
  return {handler: handler};

};

exports.match = match;
exports.matchPayload = matchPayload;
