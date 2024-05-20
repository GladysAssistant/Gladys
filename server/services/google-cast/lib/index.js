const { init } = require('./google_cast.init');
const { scan } = require('./google_cast.scan');
const { setValue } = require('./google_cast.setValue');

const GoogleCastHandler = function GoogleCastHandler(gladys, googleCastLib, serviceId) {
  this.gladys = gladys;
  this.googleCastLib = googleCastLib;
  this.serviceId = serviceId;
  this.devices = [];
  this.deviceIpAddresses = new Map();
};

GoogleCastHandler.prototype.init = init;
GoogleCastHandler.prototype.scan = scan;
GoogleCastHandler.prototype.setValue = setValue;

module.exports = GoogleCastHandler;
