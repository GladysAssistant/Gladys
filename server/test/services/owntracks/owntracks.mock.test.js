const { fake } = require('sinon');

const OwntracksHandler = function TasmotaHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.mqttService = null;
};

OwntracksHandler.prototype.connect = fake.returns(null);
OwntracksHandler.prototype.disconnect = fake.returns(null);
OwntracksHandler.prototype.handleMqttMessage = fake.returns(null);

module.exports = OwntracksHandler;
