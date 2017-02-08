const
  crypto = require("crypto"),
  env = require("./env"),
  ALGORITHM = "aes-256-ctr",
  PASSWORD = env.CIPHER_KEY;

exports.encrypt = text => {
  let cipher = crypto.createCipher(ALGORITHM, PASSWORD);
  let crypted = cipher.update(text, "utf8", "hex");
  crypted += cipher.final("hex");
  return crypted;
}

exports.decrypt = text => {
  let decipher = crypto.createDecipher(ALGORITHM, PASSWORD);
  let dec = decipher.update(text, "hex", "utf8");
  dec += decipher.final("utf8");
  return dec;
}
