"use strict";

const
  request = require("request"),
  uri = require("../config/stag.json");

let username = "",
    password = "";

let parse = response => {
  return JSON.parse(response)[0];
};

let getURL = (params, action) => {
  let url = "https://stagservices.upol.cz/ws/services/rest/" +
            uri.action.url +
            "?outputFormat=JSON";

  params.forEach(param => {
    url += `&${param}=${args[param]}`;
  });
};

exports.stagRequest = (params, action) => {
  return new Promise((resolve, reject) => {
    request({
      url: getURL(params, action),
      auth: {
        user: username,
        password: password
      }
    }, function (error, response, body) {
      if (error) {
        console.log("Stag request error: ", error);
        reject(error);
      } else if (response.body.error) {
        console.log("Error: ", response.body.error);
      } else {
        resolve(parse(body));
      }
    });
  };
};
