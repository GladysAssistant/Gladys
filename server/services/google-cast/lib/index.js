const { init } = require('./google_cast.init');
const { scan } = require('./google_cast.scan');
const { setValue } = require('./google_cast.setValue');

const GoogleCastHandler = function GoogleCastHandler(gladys, googleCastLib, bonjourLib, serviceId) {
  this.gladys = gladys;
  this.googleCastLib = googleCastLib;
  this.bonjourLib = bonjourLib;
  this.serviceId = serviceId;
  this.devices = [];
  this.deviceIpAddresses = new Map();
  this.scanTimeout = 5000;
};

GoogleCastHandler.prototype.init = init;
GoogleCastHandler.prototype.scan = scan;
GoogleCastHandler.prototype.setValue = setValue;

module.exports = GoogleCastHandler;
