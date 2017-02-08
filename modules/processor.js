"use strict";

const HANDLERS = {
  "login": {handler: "login"},
  "logout": {handler: "logout"},
  "hey": {handler: "hey"},
  "týden": {handler: "weekOddOrEven"}
};

let match = text => {

  let result = HANDLERS[text.toLowerCase()];
  return result || {handler: "repeat", values: text};

};

const PAYLOADS = {
  GREETING_PAYLOAD: "greeting",
  HELP_PAYLOAD: "help",
  STAG_AUTH_PAYLOAD: "stagAuth"
};

let matchPayload = payload => {

  let handler = PAYLOADS[payload];
  return {handler: handler};

};

exports.match = match;
exports.matchPayload = matchPayload;
