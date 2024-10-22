const { init } = require('./airplay.init');
const { scan } = require('./airplay.scan');
const { setValue } = require('./airplay.setValue');

const AirplayHandler = function AirplayHandler(gladys, airtunes, lame, bonjourLib, serviceId) {
  this.gladys = gladys;
  this.Airtunes = airtunes;
  this.lame = lame;
  this.bonjourLib = bonjourLib;
  this.serviceId = serviceId;
  this.devices = [];
  this.deviceIpAddresses = new Map();
  this.scanTimeout = 5000;
};

AirplayHandler.prototype.init = init;
AirplayHandler.prototype.scan = scan;
AirplayHandler.prototype.setValue = setValue;

module.exports = AirplayHandler;
