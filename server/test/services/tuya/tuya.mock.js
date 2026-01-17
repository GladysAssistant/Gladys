const sinon = require('sinon');

const client = {
  init: sinon.stub(),
};

const TuyaContext = function TuyaContext() {
  this.client = client;
};

module.exports = {
  TuyaContext,
  client,
};
