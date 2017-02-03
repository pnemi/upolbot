"use strict";

const
  env = require("../config/env.json");

// App Secret can be retrieved from the App Dashboard
exports.APP_SECRET = process.env.MESSENGER_APP_SECRET ||
                     env.MESSENGER_APP_SECRET;

// Arbitrary value used to validate a webhook
exports.VALIDATION_TOKEN = process.env.MESSENGER_VALIDATION_TOKEN ||
                           env.MESSENGER_VALIDATION_TOKEN;

// Generate a page access token for your page from the App Dashboard
exports.PAGE_ACCESS_TOKEN = process.env.MESSENGER_PAGE_ACCESS_TOKEN ||
                            env.MESSENGER_PAGE_ACCESS_TOKEN;

// URL where the app is running (include protocol). Used to point to scripts and
// assets located at this address.
exports.SERVER_URL = process.env.SERVER_URL ||
                     env.SERVER_URL;

if (!(this.APP_SECRET && this.VALIDATION_TOKEN && this.PAGE_ACCESS_TOKEN && this.SERVER_URL)) {
  console.error("Missing config values");
  process.exit(1);
}
