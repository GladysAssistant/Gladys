const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const TasmotaHTTPHandlerMock = function TasmotaHTTPHandlerMock() {};

TasmotaHTTPHandlerMock.prototype.connect = fake.returns(null);
TasmotaHTTPHandlerMock.prototype.disconnect = fake.returns(null);
TasmotaHTTPHandlerMock.prototype.scan = fake.returns(null);
TasmotaHTTPHandlerMock.prototype.getValue = fake.returns(null);

module.exports = TasmotaHTTPHandlerMock;

// This mock module is shared by several test files. Its fakes live in this
// file's own sandbox, so the consumers' sinon.reset() cannot clear the call
// history they record — register the sandbox so the global beforeEach clears
// it before every test (the shared sinon singleton used to do this implicitly).
require('../../../../helpers/sharedMockSandboxes').registerSharedMockSandbox(sinon);
