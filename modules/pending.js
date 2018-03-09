const
  diceCoefficient = require("dice-coefficient"),
  tokenize = require("./nlp/tokenizer"),
  handlers = require("./handlers");

const pending = {};

const initQueueIfNonExistent = sender => {
  if (!(sender in pending)) {
    pending[sender] = [];
  }
};

exports.enqueueMessage = (sender, req) => {
  initQueueIfNonExistent(sender);
  pending[sender].push(req);
};

// exports.enqueueMessage = (options, params, stagParam, handler, sender) => {
//   if (!(sender in pending)) {
//     pending[sender] = [];
//   }
//   pending[sender].push({
//     "options": options,
//     "params": params,
//     "stagParam": stagParam,
//     "handler": handler
//   });
// };

// exports.enqueuePostback = (params, stagParam, handler, sender) => {
//   if (!(sender in pending)) {
//     pending[sender] = [];
//   }
//   pending[sender].push({
//     "params": params,
//     "stagParam": stagParam,
//     "handler": handler
//   });
// };

const filterData = (data, option) => {
  let key = option.dataFilter;
  let matching;
  if (Array.isArray(data)) {
    if (Array.isArray(data[0])) {
      // plain array
      matching = data.filter(item => item.indexOf(key) !== -1);
    } else {
      // array of objects
      let value = option.param;
      matching = data.filter(item => item[key] === value);
    }
  } else {
    // must be an object / associative array
    matching = data[key];
  }
  return matching;
};

exports.enqueuePostback = (sender, req) => {
  initQueueIfNonExistent(sender);
  pending[sender].push(req);
};

exports.isPending = sender => {
  return (sender in pending) && (pending[sender].length >= 1);
};

exports.resolveMessage = (message, sender) => {
  let req = pending[sender].pop();
  let tokens = tokenize(message, false);
  let coeffs = req.options
    .map(option => {
      return tokens
        .map(token => diceCoefficient(token.text, option.msgKeyword))
        .reduce((sum, cur) => sum += cur);
    });
  let optionIndex = coeffs.reduce((highest, next, index) => {
    return (next > coeffs[highest] ? index : highest);
  }, 0);

  if ("dataFilter" in req.options[optionIndex]) {
    req.data = filterData(req.data, req.options[optionIndex]);
  }
  req.params[req.requirement] = req.options[optionIndex].param;
  handlers[req.handler](sender, req);
};

// exports.resolvePayload = (payload, sender) => {
//   let data = pending[sender].pop();
//   let params = {[data.stagParam]: data.params[payload]};
//   console.log(params);
//   handlers[data.handler](sender, params);
// };

exports.resolvePayload = (payload, sender) => {
  let request = pending[sender].pop();
  request.params[request.requirement] = request.options[payload];
  handlers[request.handler](sender, request.params, request.responseCallback);
};
