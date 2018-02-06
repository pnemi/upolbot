"use strict";

let env = {};

if (process.env.NODE_ENV === "production") {
  env = process.env;
} else {
  env = require("../config/env.json");
  process.env.NER_MODEL_URL = env.NER_MODEL_URL;
  process.env.POS_MODEL_URL = env.POS_MODEL_URL;
}

// App Secret can be retrieved from the App Dashboard
exports.MESSENGER_APP_SECRET = env.MESSENGER_APP_SECRET;

// Arbitrary value used to validate a webhook
exports.MESSENGER_VALIDATION_TOKEN = env.MESSENGER_VALIDATION_TOKEN;

// Generate a page access token for your page from the App Dashboard
exports.MESSENGER_PAGE_ACCESS_TOKEN = env.MESSENGER_PAGE_ACCESS_TOKEN;

// URL where the app is running (include protocol). Used to point to scripts and
// assets located at this address.
exports.SERVER_URL = env.SERVER_URL;

exports.DATABASE_URL = env.DATABASE_URL;

exports.CIPHER_KEY = env.CIPHER_KEY;

exports.NER_MODEL_URL = env.NER_MODEL_URL;
exports.POS_MODEL_URL = env.POS_MODEL_URL;

if (!(this.MESSENGER_APP_SECRET &&
      this.MESSENGER_VALIDATION_TOKEN &&
      this.MESSENGER_PAGE_ACCESS_TOKEN &&
      this.SERVER_URL &&
      this.DATABASE_URL &&
      this.CIPHER_KEY &&
      this.NER_MODEL_URL &&
      this.POS_MODEL_URL)) {
  console.error("Missing config values");
  process.exit(1);
}
