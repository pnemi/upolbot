/* jshint node: true, esversion: 6 */
"use strict";

const
  express = require("express"),
  bodyParser = require("body-parser"),
  hat = require("hat"),
  messenger = require("./modules/messenger"),
  processor = require("./modules/processor"),
  handlers = require("./modules/handlers"),
  stag = require("./modules/stag"),
  db = require("./modules/db"),
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

  let auth = {
    user: req.body.login,
    password: req.body.password
  };

  let promStagUser = stag.request("getStagUserForActualUser", [], auth);
  let promPSID = messenger.getPSID(req.body.accountLinkingToken);

  Promise.all([promStagUser, promPSID]).then(values => {
    let stagNumber = values[0].userName;
    let psid = values[1].recipient;
    db.insertStudent(psid, auth.user, auth.password, stagNumber).then(() => {
      res.redirect(req.body.redirectURISuccess);
    }).catch(reason => {
      console.log(reason);
    });
  }).catch(reason => {
    if (reason === "UNAUTHORIZED") {

      let locals = {
        accountLinkingToken: req.body.accountLinkingToken,
        redirectURI: req.body.redirectURI,
        redirectURISuccess: req.body.redirectURISuccess,
        authFailed: true
      };

      res.render("authorize", locals);
    }
  });
});

app.get("/authorize", function(req, res) {

  let accountLinkingToken = req.query.account_linking_token;
  let redirectURI = req.query.redirect_uri;
  let authCode = hat();
  let redirectURISuccess = redirectURI + "&authorization_code=" + authCode;

  let locals = {
    accountLinkingToken: accountLinkingToken,
    redirectURI: redirectURI,
    redirectURISuccess: redirectURI + "&authorization_code=" + authCode,
    authFailed: false
  };

  res.render("authorize", locals);

});

let receivedAccountLink = event => {

  let sender = event.sender.id;
  let status = event.account_linking.status;

  if (status === "unlinked") {
    db.deleteStudentByPSID(sender).then(() => {
      handlers.loggedOut(sender, "YES")
    }).catch(error => {
      handlers.loggedOut(sender, error);
    });
  }

};

// handler receiving messages
app.post("/webhook", function (req, res) {

  var data = req.body;


  data.entry.forEach(function(pageEntry) {
    pageEntry.messaging.forEach(function(messagingEvent) {

      let sender = messagingEvent.sender.id;

      if (messagingEvent.message && messagingEvent.message.text) {
        let message = messagingEvent.message.text;

        //let result = processor.match(message);
        try {
          let result = JSON.parse(message);
          callHandler(result, sender);
        } catch(e) {
          console.log(e);
        }

      } else if (messagingEvent.account_linking) {
        receivedAccountLink(messagingEvent);
      } else if (messagingEvent.postback) {

        let payload = messagingEvent.postback.payload;
        let result = processor.matchPayload(payload);
        callHandler(result, sender);
      }

      res.sendStatus(200);
    });
  });

});

let callHandler = (result, sender) => {
  if (result) {
    let handler = handlers[result.handler];
    if (handler && typeof handler === "function") {
      handler(sender, result.stag_params, result.query_params);
    } else {
      console.log("Handler " + result.handler + " is not defined");
    }
  }
};

app.listen(app.get("port"), function () {
    console.log("Express server listening on port " + app.get("port"));
});
