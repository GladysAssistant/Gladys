const { connect } = require('./nuki.http.connect');
const { getDiscoveredDevices } = require('./nuki.http.getDiscoveredDevices');
const { scan } = require('./nuki.http.scan');
const { convertToDevice } = require('./nuki.http.convertToDevice');

const { setValue } = require('./nuki.http.setValue');
/*
const { getValue } = require('./nuki.http.getValue');
const { setValue } = require('./nuki.http.setValue');

const { status } = require('./nuki.http.status');
const { subStatus } = require('./nuki.http.subStatus');
*/

/**
 * @description Add ability to connect to Nuki HTTP devices.
 * @param {object} nukiHandler - Nuki instance.
 * @example
 * const nukiHttpHandler = new NukiHTTPHandler(nukitaHandler);
 */
const NukiHTTPHandler = function NukiHTTPHandler(nukiHandler) {
  this.nukiHandler = nukiHandler;
  // Found devices
  this.discoveredDevices = {};
  this.nukiApi = undefined;
};

// Commons
NukiHTTPHandler.prototype.connect = connect;
NukiHTTPHandler.prototype.getDiscoveredDevices = getDiscoveredDevices;
NukiHTTPHandler.prototype.scan = scan;
NukiHTTPHandler.prototype.convertToDevice = convertToDevice;
NukiHTTPHandler.prototype.setValue = setValue;

/*
NukiHTTPHandler.prototype.getValue = getValue;


// HTTP
NukiHTTPHandler.prototype.status = status;
NukiHTTPHandler.prototype.subStatus = subStatus;
*/
module.exports = NukiHTTPHandler;
