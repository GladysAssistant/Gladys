const { init } = require('./airplay.init');
const { scan } = require('./airplay.scan');
const { setValue } = require('./airplay.setValue');

const AirplayHandler = function AirplayHandler(gladys, airtunes, bonjourLib, childProcess, serviceId) {
  this.gladys = gladys;
  this.Airtunes = airtunes;
  this.bonjourLib = bonjourLib;
  this.childProcess = childProcess;
  this.serviceId = serviceId;
  this.devices = [];
  this.deviceIpAddresses = new Map();
  this.scanTimeout = 5000;
};

AirplayHandler.prototype.init = init;
AirplayHandler.prototype.scan = scan;
AirplayHandler.prototype.setValue = setValue;

module.exports = AirplayHandler;
