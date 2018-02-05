const
  diceCoefficient = require("dice-coefficient"),
  tokenize = require("./nlp/tokenizer"),
  handlers = require("./handlers");

const pending = {};

exports.enqueueMessage = (options, params, stagParam, handler, sender) => {
  if (!(sender in pending)) {
    pending[sender] = [];
  }
  pending[sender].push({
    "options": options,
    "params": params,
    "stagParam": stagParam,
    "handler": handler
  });
};

exports.enqueuePostback = (params, stagParam, handler, sender) => {
  if (!(sender in pending)) {
    pending[sender] = [];
  }
  pending[sender].push({
    "params": params,
    "stagParam": stagParam,
    "handler": handler
  });
};

exports.isPending = sender => {
  return sender in pending && pending[sender].length >= 1;
};

exports.resolveMessage = (message, sender) => {
  let data = pending[sender].pop();
  let tokens = tokenize(message, false);
  let coeffs = data.options
    .map(option => {
      return tokens
        .map(token => diceCoefficient(token.text, option))
        .reduce((sum, cur) => sum += cur);
    });
  let chosen = coeffs.reduce((highest, next, index) => {
    return (next > coeffs[highest] ? index : highest);
  }, 0);
  let stagParams = {[data.stagParam]: data.params[chosen]};
  handlers[data.handler](sender, stagParams);
};

exports.resolvePayload = (payload, sender) => {
  let data = pending[sender].pop();
  let params = {[data.stagParam]: data.params[payload]};
  console.log(params);
  handlers[data.handler](sender, params);
};
