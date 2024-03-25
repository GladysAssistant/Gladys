const { fake } = require('sinon');

const vacbotStatus = {
  name: 'DEEBOT OZMO 920 Series',
  model: 'Deebot 2022',
};

const EcovacsHandlerMock = function EcovacsHandlerMock(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
};

EcovacsHandlerMock.prototype.stop = fake.returns(null);
EcovacsHandlerMock.prototype.start = fake.returns(null);
EcovacsHandlerMock.prototype.connect = fake.resolves(true);
EcovacsHandlerMock.prototype.listen = fake.resolves(true);
EcovacsHandlerMock.prototype.getStatus = fake.resolves(true);
EcovacsHandlerMock.prototype.getConfiguration = fake.resolves({
  accountId: 'accountId',
  password: 'password',
  countryCode: 'countryCode',
});
EcovacsHandlerMock.prototype.discover = fake.returns(['device']);
EcovacsHandlerMock.prototype.setValue = fake.resolves(true);
EcovacsHandlerMock.prototype.poll = fake.resolves(true);
EcovacsHandlerMock.prototype.getDeviceStatus = fake.resolves(vacbotStatus);
EcovacsHandlerMock.prototype.onMessage = fake.resolves(true);
EcovacsHandlerMock.prototype.loadVacbots = fake.resolves(true);
EcovacsHandlerMock.prototype.getVacbotObj = fake.resolves(true);

module.exports = {
  EcovacsHandlerMock,
  vacbotStatus,
};
