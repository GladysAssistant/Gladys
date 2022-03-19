const { fake } = require('sinon');

const TuyaHandler = function TuyaHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
};

TuyaHandler.prototype.connect = fake.returns(null);
TuyaHandler.prototype.disconnect = fake.returns(null);

module.exports = TuyaHandler;
