const { fake } = require('sinon');

const SonoffHandler = function SonoffHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.mqttService = null;
  this.mqttDevices = {};
};

SonoffHandler.prototype.connect = fake.returns(null);
SonoffHandler.prototype.disconnect = fake.returns(null);
SonoffHandler.prototype.handleMqttMessage = fake.returns(null);

module.exports = SonoffHandler;
