const { fake } = require('sinon');

const TasmotaHandler = function TasmotaHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.mqttService = null;
  this.mqttDevices = {};
};

TasmotaHandler.prototype.connect = fake.returns(null);
TasmotaHandler.prototype.disconnect = fake.returns(null);
TasmotaHandler.prototype.handleMqttMessage = fake.returns(null);

module.exports = TasmotaHandler;
