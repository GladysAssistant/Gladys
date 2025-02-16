const { connect } = require('./nuki.http.connect');
const { disconnect } = require('./nuki.http.disconnect');
const { scan } = require('./nuki.http.scan');
/*

const { getDiscoveredDevices } = require('./nuki.http.getDiscoveredDevices');
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
};

// Commons
NukiHTTPHandler.prototype.connect = connect;
NukiHTTPHandler.prototype.disconnect = disconnect;
NukiHTTPHandler.prototype.scan = scan;
/*

NukiHTTPHandler.prototype.getDiscoveredDevices = getDiscoveredDevices;
NukiHTTPHandler.prototype.getValue = getValue;
NukiHTTPHandler.prototype.setValue = setValue;

// HTTP
NukiHTTPHandler.prototype.status = status;
NukiHTTPHandler.prototype.subStatus = subStatus;
*/
module.exports = NukiHTTPHandler;
