"use strict";

const
request = require("request"),
env = require("./env");

const FB_API_URL = "https://graph.facebook.com/v2.12";

const senderAction = (recipient, action) => {
  request({
    url: `${FB_API_URL}/me/messages`,
    qs: {access_token: env.MESSENGER_PAGE_ACCESS_TOKEN},
    method: "POST",
    json: {
      "recipient": {"id": recipient},
      "sender_action": action
    }
  }, (error, response) => {
    if (error) {
      console.log("Error sending message: ", error);
    } else if (response.body.error) {
      console.log("Error: ", response.body.error);
    }
  });
};

exports.markSeen = recipient => senderAction(recipient, "mark_seen");
exports.typingOn = recipient => senderAction(recipient, "typing_on");
exports.typingOff = recipient => senderAction(recipient, "typing_off");

exports.send = (message, recipient) => {
  request({
    url: `${FB_API_URL}/me/messages`,
    qs: {access_token: env.MESSENGER_PAGE_ACCESS_TOKEN},
    method: "POST",
    json: {
      "recipient": {"id": recipient},
      "message": message,
      "messaging_type": "RESPONSE"
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
      url: `${FB_API_URL}/me/messages`,
      qs: {access_token: env.MESSENGER_PAGE_ACCESS_TOKEN},
      method: "POST",
      json: {
        "recipient": {"id": recipient},
        "message": message,
        "messaging_type": "RESPONSE"
      }
    }, (error, response) => {
      if (error) {
        console.log("Error sending message: ", error);
        reject(error);
      } else if (response.body.error) {
        console.log("Error: ", response.body.error);
      }
    });
  });
};

exports.sendText = (text, recipient) => {
  request({
    url: `${FB_API_URL}/me/messages`,
    qs: {access_token: env.MESSENGER_PAGE_ACCESS_TOKEN},
    method: "POST",
    json: {
      "recipient": {"id": recipient},
      "message": {"text": text},
      "messaging_type": "RESPONSE"
    }
  }, (error, response) => {
    if (error) {
      console.log("Error sending message: ", error);
    } else if (response.body.error) {
      console.log("Error: ", response.body.error);
    }
  });
};

exports.sendTextPromise = (text, recipient) => {

  return new Promise((resolve, reject) => {
    request({
      url: `${FB_API_URL}/me/messages`,
      qs: {access_token: env.MESSENGER_PAGE_ACCESS_TOKEN},
      method: "POST",
      json: {
        "recipient": {"id": recipient},
        "message": {"text": text},
        "messaging_type": "RESPONSE"
      }
    }, (error, response) => {
      if (error) {
        console.log("Error sending message: ", error);
        reject(error);
      } else if (response.body.error) {
        console.log("Error: ", response.body.error);
      }
    });
  });
};

exports.getPSID = (accountLinkingToken) => {

  return new Promise((resolve, reject) => {

    request({
      url: `${FB_API_URL}/me`,
      qs: {
        access_token: env.MESSENGER_PAGE_ACCESS_TOKEN,
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
      url: `${FB_API_URL}/${userId}`,
      qs: {
        fields: "first_name,last_name,gender",
        access_token: env.MESSENGER_PAGE_ACCESS_TOKEN
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
