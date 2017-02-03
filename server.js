/* jshint node: true, esversion: 6 */
"use strict";

const
  express = require("express"),
  bodyParser = require("body-parser"),
  messenger = require("./modules/messenger"),
  processor = require("./modules/processor"),
  handlers = require("./modules/handlers"),
  env = require("./modules/env");

var app = express();

app.set("port", process.env.PORT || 3000);
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());
app.set("view engine", "ejs");

// Server frontpage
app.get("/", function (req, res) {
  res.send("This is UPOL Bot Server");
});

// Facebook Webhook
app.get("/webhook", function (req, res) {
  if (req.query["hub.verify_token"] === env.VALIDATION_TOKEN) {
    res.send(req.query["hub.challenge"]);
  } else {
    res.send("Invalid verify token");
  }
});

app.post("/authorize", (req, res, next) => {
  console.log(req.body.login);
  console.log(req.body.password);
  res.redirect(req.body.redirect);
});

app.get("/authorize", function(req, res) {
  var accountLinkingToken = req.query.account_linking_token;
  var redirectURI = req.query.redirect_uri;

  // Authorization Code should be generated per user by the developer. This will
  // be passed to the Account Linking callback.
  var authCode = "1234567890";

  // Redirect users to this URI on successful login
  var redirectURISuccess = redirectURI + "&authorization_code=" + authCode;

  res.render("authorize", {
    accountLinkingToken: accountLinkingToken,
    redirectURI: redirectURI,
    redirectURISuccess: redirectURISuccess
  });
});

function receivedAccountLink(event) {
  var senderID = event.sender.id;
  var recipientID = event.recipient.id;

  var status = event.account_linking.status;
  var authCode = event.account_linking.authorization_code;

  console.log("Received account link event with for user %d with status %s " +
    "and auth code %s ", senderID, status, authCode);
}

let receivedPostback = (payload, sender) => {

  let payloads = {
    GREETING_PAYLOAD: "greeting",
    HELP_PAYLOAD: "help",
    STAG_AUTH_PAYLOAD: "stagAuth",
  };
  let handler = payloads[payload];

  handlers[handler](sender);

};

// handler receiving messages
app.post("/webhook", function (req, res) {

  var data = req.body;


  data.entry.forEach(function(pageEntry) {
    pageEntry.messaging.forEach(function(messagingEvent) {

      let sender = messagingEvent.sender.id;

      if (messagingEvent.message && messagingEvent.message.text) {
        let message = messagingEvent.message.text;

        let result = processor.match(message);

        if (result) {
          let handler = handlers[result.handler];
          if (handler && typeof handler === "function") {
            handler(sender, result.values);
          } else {
            console.log("Handler " + result.handler + " is not defined");
          }
        }
      } else if (messagingEvent.account_linking) {
        receivedAccountLink(messagingEvent);
      } else if (messagingEvent.postback) {
        receivedPostback(messagingEvent.postback.payload, sender);
      }

      res.sendStatus(200);
    });
  });

});

app.listen(app.get("port"), function () {
    console.log("Express server listening on port " + app.get("port"));
});
