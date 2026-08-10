const sinon = require('sinon').createSandbox();

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

// This mock module is shared by several test files. Its fakes live in this
// file's own sandbox, so the consumers' sinon.reset() cannot clear the call
// history they record — register the sandbox so the global beforeEach clears
// it before every test (the shared sinon singleton used to do this implicitly).
require('../../helpers/sharedMockSandboxes').registerSharedMockSandbox(sinon);
