"use strict";

const
  request = require("request"),
  uri = require("../config/stag.json"),
  db = require("./db");

const STUDENT_ROLE = "ST";

let parse = response => {
  return JSON.parse(response)[0];
};

let getURL = (action, params) => {
  let url = "https://stagservices.upol.cz/ws/services/rest/" +
            uri[action].url +
            "?outputFormat=JSON";

  for (let param in params) {
    // search wildcards
    if ("wildcard_params" in uri[action] &&
        uri[action].wildcard_params.includes(param)) {
      url += `&${param}=%25${params[param]}%25`;
    } else {
      url += `&${param}=${params[param]}`;
    }
  }

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

exports.request = (action, params, auth, sender) => {
  return new Promise((resolve, reject) => {
    request(
      getOptions(action, params, auth, sender),
      (error, response, body) => {
        if (error) {
          console.log("Stag request error: ", error);
          reject(error);
        } else if (response.body.error) {
          console.log("Error: ", response.body.error);
          reject(response.body.error);
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

exports.login = auth => {
  return new Promise((resolve, reject) => {
    request(
      getOptions("getStagUserForActualUser", [], auth),
      (error, response, body) => {
        if (error) {
          console.log("Stag request error: ", error);
          reject(error);
        } else if (response.body.error) {
          console.log("Error: ", response.body.error);
          reject(response.body.error);
        } else {
          if (response.statusCode === 401) {
            reject("UNAUTHORIZED");
          } else {
            let userInfo = parse(body);
            if (userInfo.role !== STUDENT_ROLE) {
              reject("NOT_STUDENT");
            } else {
              resolve(userInfo);
            }
          }
        }
    });
  });
};
