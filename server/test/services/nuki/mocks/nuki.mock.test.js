const sinon = require('sinon').createSandbox();

const { fake } = sinon;

const discoveredDevices = [{ device: 'first' }, { device: 'second' }];

const NukiHandlerMock = function NukiHandlerMock(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
};

// COMMANDS
NukiHandlerMock.prototype.start = fake.returns(null);
NukiHandlerMock.prototype.stop = fake.returns(null);
NukiHandlerMock.prototype.getStatus = fake.resolves({
  mqttOk: true,
  webOk: true,
});

// CONFIG
NukiHandlerMock.prototype.getConfiguration = fake.resolves({
  apiKey: '42',
});
NukiHandlerMock.prototype.saveConfiguration = fake.resolves(true);
NukiHandlerMock.prototype.getHandler = fake.returns(true);

// DEVICE
NukiHandlerMock.prototype.scan = fake.returns(discoveredDevices);
NukiHandlerMock.prototype.getDiscoveredDevices = fake.returns(discoveredDevices);
NukiHandlerMock.prototype.setValue = fake.returns(null);
NukiHandlerMock.prototype.mergeWithExistingDevice = fake.returns(null);
NukiHandlerMock.prototype.notifyNewDevice = fake.returns(null);
NukiHandlerMock.prototype.poll = fake.returns(null);
NukiHandlerMock.prototype.getProtocolFromDevice = fake.returns(null);
NukiHandlerMock.prototype.postCreate = fake.returns(null);
NukiHandlerMock.prototype.postDelete = fake.returns(null);

module.exports = {
  NukiHandlerMock,
};

// This mock module is shared by several test files. Its fakes live in this
// file's own sandbox, so the consumers' sinon.reset() cannot clear the call
// history they record — register the sandbox so the global beforeEach clears
// it before every test (the shared sinon singleton used to do this implicitly).
require('../../../helpers/sharedMockSandboxes').registerSharedMockSandbox(sinon);
