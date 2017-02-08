"use strict";

const
  request = require("request"),
  uri = require("../config/stag.json"),
  db = require("./db");

let parse = response => {
  return JSON.parse(response)[0];
};

let getURL = (action, params) => {
  let url = "https://stagservices.upol.cz/ws/services/rest/" +
            uri[action].url +
            "?outputFormat=JSON";

  params.forEach(param => {
    url += `&${param}=${args[param]}`;
  });

  return url;
};

let getOptions = (action, params, auth, sender) => {
  let options = {};
  options.url = getURL(action, params);
  if (uri[action].auth_req) {
    options.auth = auth || db.selectStudentWithAuthByPSID(sender);
  }
  return options;
};

exports.stagRequest = (action, params, auth, sender) => {
  return new Promise((resolve, reject) => {
    request(
      getOptions(action, params, auth, sender)
    , function (error, response, body) {
      if (error) {
        console.log("Stag request error: ", error);
        reject(error);
      } else if (response.body.error) {
        console.log("Error: ", response.body.error);
      } else {
        if (response.statusCode === 401) {
          reject("UNAUTHORIZED");
        } else {
          resolve(parse(body));
        }
      }
    });
  });
};
