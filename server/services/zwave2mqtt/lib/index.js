const { connect } = require('./connect');
const { disconnect } = require('./disconnect');
const { startDiscoveringDevices } = require('./startDiscoveringDevices');
const { status } = require('./status');
const { handleMessage } = require('./handleMessage');
const { handleDevicesMessage } = require('./handleDevicesMessage');
const { getDiscoveredDevices } = require('./getDiscoveredDevices');
const { setValue } = require('./setValue');
const { mergeWithExistingDevice } = require('./mergeWithExistingDevice');

/**
 * @description Add ability to connect to Zwave2mqtt devices.
 * @param {Object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const zwave2mqttHandler = new Zwave2mqttHandler(gladys, eventManager, serviceId);
 */
const Zwave2mqttHandler = function Zwave2mqttHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.eventManager = gladys.event;
  this.serviceId = serviceId;
  this.scanInProgress = false;

  // Gladys MQTT service
  this.mqttService = null;

  // Found devices
  this.nodes = {};
};

Zwave2mqttHandler.prototype.connect = connect;
Zwave2mqttHandler.prototype.disconnect = disconnect;
Zwave2mqttHandler.prototype.startDiscoveringDevices = startDiscoveringDevices;
Zwave2mqttHandler.prototype.status = status;
Zwave2mqttHandler.prototype.handleMessage = handleMessage;
Zwave2mqttHandler.prototype.handleDevicesMessage = handleDevicesMessage;
Zwave2mqttHandler.prototype.getDiscoveredDevices = getDiscoveredDevices;
Zwave2mqttHandler.prototype.setValue = setValue;
Zwave2mqttHandler.prototype.mergeWithExistingDevice = mergeWithExistingDevice;

module.exports = Zwave2mqttHandler;
