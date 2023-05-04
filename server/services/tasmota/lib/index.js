const TasmotaMQTTHandler = require('./mqtt');
const TasmotaHTTPHandler = require('./http');

const { DEVICE_PARAM_NAME, DEVICE_PARAM_VALUE } = require('./tasmota.constants');

const { getHandler } = require('./tasmota.getHandler');

const { connect } = require('./tasmota.connect');
const { disconnect } = require('./tasmota.disconnect');

const { scan } = require('./tasmota.scan');

const { getDiscoveredDevices } = require('./tasmota.getDiscoveredDevices');
const { setValue } = require('./tasmota.setValue');
const { mergeWithExistingDevice } = require('./tasmota.mergeWithExistingDevice');
const { notifyNewDevice } = require('./tasmota.notifyNewDevice');
const { poll } = require('./tasmota.poll');

const { getProtocolFromDevice } = require('./tasmota.getProtocolFromDevice');

/**
 * @description Add ability to connect to Tasmota devices.
 * @param {object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const tasmotaHandler = new TasmotaHandler(gladys, serviceId);
 */
const TasmotaHandler = function TasmotaHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;

  this.protocols = {};
  // MQTT
  this.protocols[DEVICE_PARAM_VALUE[DEVICE_PARAM_NAME.PROTOCOL].MQTT] = new TasmotaMQTTHandler(this);
  // HTTP
  this.protocols[DEVICE_PARAM_VALUE[DEVICE_PARAM_NAME.PROTOCOL].HTTP] = new TasmotaHTTPHandler(this);
};

TasmotaHandler.prototype.getHandler = getHandler;

TasmotaHandler.prototype.connect = connect;
TasmotaHandler.prototype.disconnect = disconnect;
TasmotaHandler.prototype.scan = scan;

TasmotaHandler.prototype.getDiscoveredDevices = getDiscoveredDevices;
TasmotaHandler.prototype.setValue = setValue;
TasmotaHandler.prototype.mergeWithExistingDevice = mergeWithExistingDevice;
TasmotaHandler.prototype.notifyNewDevice = notifyNewDevice;
TasmotaHandler.prototype.poll = poll;
TasmotaHandler.prototype.getProtocolFromDevice = getProtocolFromDevice;

module.exports = TasmotaHandler;
