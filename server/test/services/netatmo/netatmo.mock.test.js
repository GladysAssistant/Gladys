const { fake } = require('sinon');

const NetatmoHandler = function NetatmoHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.api = undefined;
  this.sensors = {};
  this.devices = {};
  this.connected = false;
  this.topicBinds = {};
  this.configured = false;
};

NetatmoHandler.prototype.connect = fake.returns(null);

module.exports = NetatmoHandler;
