const sinon = require('sinon').createSandbox();

const { stub } = sinon;
const { Client } = require('../../../services/tp-link/node_modules/tplink-smarthome-api');

const MockedTpLinkApiClient = stub(Client);

module.exports = { Client: MockedTpLinkApiClient };

// This mock module is shared by several test files. Its fakes live in this
// file's own sandbox, so the consumers' sinon.reset() cannot clear the call
// history they record — register the sandbox so the global beforeEach clears
// it before every test (the shared sinon singleton used to do this implicitly).
require('../../helpers/sharedMockSandboxes').registerSharedMockSandbox(sinon);
