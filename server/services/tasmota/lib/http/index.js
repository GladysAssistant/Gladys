const { connect } = require('./tasmota.http.connect');
const { disconnect } = require('./tasmota.http.disconnect');
const { scan } = require('./tasmota.http.scan');
const { getDiscoveredDevices } = require('./tasmota.http.getDiscoveredDevices');
const { getValue } = require('./tasmota.http.getValue');
const { setValue } = require('./tasmota.http.setValue');

const { status } = require('./tasmota.http.status');
const { subStatus } = require('./tasmota.http.subStatus');

/**
 * @description Add ability to connect to Tasmota HTTP devices.
 * @param {object} tasmotaHandler - Tasmota instance.
 * @example
 * const tasmotaHandler = new TasmotaHandler(tasmotaHandler);
 */
const TasmotaHTTPHandler = function TasmotaHTTPHandler(tasmotaHandler) {
  this.tasmotaHandler = tasmotaHandler;
  // Found devices
  this.discoveredDevices = {};
};

// Commons
TasmotaHTTPHandler.prototype.connect = connect;
TasmotaHTTPHandler.prototype.disconnect = disconnect;
TasmotaHTTPHandler.prototype.scan = scan;
TasmotaHTTPHandler.prototype.getDiscoveredDevices = getDiscoveredDevices;
TasmotaHTTPHandler.prototype.getValue = getValue;
TasmotaHTTPHandler.prototype.setValue = setValue;

// HTTP
TasmotaHTTPHandler.prototype.status = status;
TasmotaHTTPHandler.prototype.subStatus = subStatus;

module.exports = TasmotaHTTPHandler;
