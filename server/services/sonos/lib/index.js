const { init } = require('./sonos.init');
const { scan } = require('./sonos.scan');
const { setValue } = require('./sonos.setValue');
const { onAvTransportEvent } = require('./sonos.onAvTransportEvent');
const { onVolumeEvent } = require('./sonos.onVolumeEvent');

const SonosHandler = function SonosHandler(gladys, sonosLib, serviceId) {
  this.gladys = gladys;
  this.sonosLib = sonosLib;
  this.serviceId = serviceId;
  this.manager = null;
  this.devices = [];
};

SonosHandler.prototype.init = init;
SonosHandler.prototype.scan = scan;
SonosHandler.prototype.setValue = setValue;
SonosHandler.prototype.onAvTransportEvent = onAvTransportEvent;
SonosHandler.prototype.onVolumeEvent = onVolumeEvent;

module.exports = SonosHandler;
