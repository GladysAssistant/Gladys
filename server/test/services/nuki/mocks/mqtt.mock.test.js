const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const mqttService = {
  isUsed: fake.resolves(true),
  device: {
    publish: fake.returns(true),
    subscribe: fake.returns(true),
    unsubscribe: fake.returns(true),
  },
};

module.exports = {
  mqttService,
};

// This mock module is shared by several test files. Its fakes live in this
// file's own sandbox, so the consumers' sinon.reset() cannot clear the call
// history they record — register the sandbox so the global beforeEach clears
// it before every test (the shared sinon singleton used to do this implicitly).
require('../../../helpers/sharedMockSandboxes').registerSharedMockSandbox(sinon);
