const { init } = require('./zwaveJSUI.init');
const { connect } = require('./zwaveJSUI.connect');
const { disconnect } = require('./zwaveJSUI.disconnect');
const { getConfiguration } = require('./zwaveJSUI.getConfiguration');
const { handleNewMessage } = require('./zwaveJSUI.handleNewMessage');
const { onNewDeviceDiscover } = require('./zwaveJSUI.onNewDeviceDiscover');
const { onNodeValueUpdated } = require('./zwaveJSUI.onNodeValueUpdated');
const { publish } = require('./zwaveJSUI.publish');
const { scan } = require('./zwaveJSUI.scan');
const { saveConfiguration } = require('./zwaveJSUI.saveConfiguration');
const { setValue } = require('./zwaveJSUI.setValue');
const { getZwaveJsDevice } = require('./zwaveJSUI.getZwaveJsDevice');
const { getDevice } = require('./zwaveJSUI.getDevice');

/**
 * @description Z-Wave JS UI handler.
 * @param {object} gladys - Gladys instance.
 * @param {object} mqttLibrary - MQTT lib.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const zwaveJSUIHandler = new ZwaveJSUIHandler(gladys, client, serviceId);
 */
const ZwaveJSUIHandler = function ZwaveJSUIHandler(gladys, mqttLibrary, serviceId) {
  this.gladys = gladys;
  this.mqttLibrary = mqttLibrary;
  this.serviceId = serviceId;
  this.mqttClient = null;
  this.configured = false;
  this.connected = false;
  this.devices = [];
  this.zwaveJSDevices = [];
};

ZwaveJSUIHandler.prototype.init = init;
ZwaveJSUIHandler.prototype.connect = connect;
ZwaveJSUIHandler.prototype.disconnect = disconnect;
ZwaveJSUIHandler.prototype.getConfiguration = getConfiguration;
ZwaveJSUIHandler.prototype.getDevice = getDevice;
ZwaveJSUIHandler.prototype.getZwaveJsDevice = getZwaveJsDevice;
ZwaveJSUIHandler.prototype.handleNewMessage = handleNewMessage;
ZwaveJSUIHandler.prototype.onNewDeviceDiscover = onNewDeviceDiscover;
ZwaveJSUIHandler.prototype.onNodeValueUpdated = onNodeValueUpdated;
ZwaveJSUIHandler.prototype.publish = publish;
ZwaveJSUIHandler.prototype.scan = scan;
ZwaveJSUIHandler.prototype.saveConfiguration = saveConfiguration;
ZwaveJSUIHandler.prototype.setValue = setValue;

module.exports = ZwaveJSUIHandler;
