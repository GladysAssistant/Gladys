const { fake } = require('sinon');

const RhasspyHandler = function RhasspyHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.sensors = {};
  this.devices = {};
  this.connected = false;
  this.rhasspyRunning = false;
  this.configured = false;
};

RhasspyHandler.prototype.init = fake.returns(null);
RhasspyHandler.prototype.installRhasspyContainer = fake.returns(null);
RhasspyHandler.prototype.listening = fake.returns(null);

module.exports = RhasspyHandler;
