const { fake } = require('sinon');

const NetatmoHandler = function NetatmoHandler(gladys, ffmpeg, serviceId) {
  this.gladys = gladys;
  this.ffmpeg = ffmpeg;
  this.serviceId = serviceId;
  this.api = undefined;
  this.sensors = {};
  this.devices = {};
  this.connected = false;
  this.topicBinds = {};
  this.configured = false;
  this.token = undefined;
  this.pollHomeCoachWeather = undefined;
  this.pollEnergy = undefined;
  this.pollSecurity = undefined;
};

NetatmoHandler.prototype.connect = fake.returns(null);

module.exports = NetatmoHandler;
