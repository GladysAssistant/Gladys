const { fake } = require('sinon');

const discoveredDevices = [{ device: 'first' }, { device: 'second' }];

const NukiHandlerMock = function NukiHandlerMock(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
};

NukiHandlerMock.prototype.stop = fake.returns(null);
NukiHandlerMock.prototype.start = fake.returns(null);
NukiHandlerMock.prototype.getStatus = fake.resolves(true);
NukiHandlerMock.prototype.saveConfiguration = fake.resolves(true);
NukiHandlerMock.prototype.getConfiguration = fake.resolves({
  apiKey: '42',
});
NukiHandlerMock.prototype.getDiscoveredDevices = fake.returns(discoveredDevices);
NukiHandlerMock.prototype.scan = fake.returns(discoveredDevices);
NukiHandlerMock.prototype.connect = fake.returns(null);
NukiHandlerMock.prototype.disconnect = fake.returns(null);
NukiHandlerMock.prototype.getValue = fake.returns(null);

module.exports = {
  NukiHandlerMock,
};
