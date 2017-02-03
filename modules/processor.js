"use strict";

let match = text => {
  if (text === "hey") {
    return {handler: "hey"};
  } else if (text === "login") {
    return {handler: "login"};
  } else if (text === "logout") {
    return {handler: "logout"};
  } else if (text == 1) {
    return {handler: "weekOddOrEven"}
  }
  return {handler: "repeat", values: text};
};

exports.match = match;
