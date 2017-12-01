"use strict";

const
request = require("request"),
env = require("./env");

exports.send = (message, recipient) => {
  request({
    url: "https://graph.facebook.com/v2.6/me/messages",
    qs: {access_token: env.PAGE_ACCESS_TOKEN},
    method: "POST",
    json: {
      recipient: {id: recipient},
      message: message,
    }
  }, (error, response) => {
    if (error) {
      console.log("Error sending message: ", error);
    } else if (response.body.error) {
      console.log("Error: ", response.body.error);
    }
  });
};

exports.sendPromise = (message, recipient) => {

  return new Promise((resolve, reject) => {

  request({
    url: "https://graph.facebook.com/v2.6/me/messages",
    qs: {access_token: env.PAGE_ACCESS_TOKEN},
    method: "POST",
    json: {
      recipient: {id: recipient},
      message: message,
    }
  }, (error, response) => {
    if (error) {
      console.log("Error sending message: ", error);
      reject(error);
    } else if (response.body.error) {
      console.log("Error: ", response.body.error);
    } else {
      resolve();
    }
  });

  });
};

exports.getPSID = (accountLinkingToken) => {

  return new Promise((resolve, reject) => {

    request({
      url: "https://graph.facebook.com/v2.6/me",
      qs: {
        access_token: env.PAGE_ACCESS_TOKEN,
        fields: "recipient",
        account_linking_token: accountLinkingToken
      },
      method: "GET"
    }, (error, response) => {
      if (error) {
        console.log("Error sending message: ", error);
        reject(error);
      } else if (response.body.error) {
        console.log("Error: ", response.body.error);
      } else {
        resolve(JSON.parse(response.body));
      }
    });

  });
};

exports.getUserInfo = (userId) => {

  return new Promise((resolve, reject) => {

    request({
      url: `https://graph.facebook.com/v2.6/${userId}`,
      qs: {
        fields: "first_name,last_name,gender",
        access_token: env.PAGE_ACCESS_TOKEN
      },
      method: "GET",
    }, (error, response) => {
      if (error) {
        console.log("Error sending message: ", error);
        reject(error);
      } else if (response.body.error) {
        console.log("Error: ", response.body.error);
      } else {
        resolve(JSON.parse(response.body));
      }
    });

  });
};
