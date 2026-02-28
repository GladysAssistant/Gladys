const sinon = require('sinon');

const client = {
  init: sinon.stub(),
};

const TuyaContext = function TuyaContext() {
  this.client = client;
  this.request = sinon.stub().resolves({ result: { list: [] }, success: true });
};

module.exports = {
  TuyaContext,
  client,
};
