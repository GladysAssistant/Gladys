const { init } = require('./zwaveJSUI.init');
const { connect } = require('./zwaveJSUI.connect');
const { disconnect } = require('./zwaveJSUI.disconnect');
const { getConfiguration } = require('./zwaveJSUI.getConfiguration');
const { handleNewMessage } = require('./zwaveJSUI.handleNewMessage');
const { onNewDeviceDiscover } = require('./zwaveJSUI.onNewDeviceDiscover');
const { publish } = require('./zwaveJSUI.publish');
const { scan } = require('./zwaveJSUI.scan');
const { saveConfiguration } = require('./zwaveJSUI.saveConfiguration');

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
};

ZwaveJSUIHandler.prototype.init = init;
ZwaveJSUIHandler.prototype.connect = connect;
ZwaveJSUIHandler.prototype.disconnect = disconnect;
ZwaveJSUIHandler.prototype.getConfiguration = getConfiguration;
ZwaveJSUIHandler.prototype.handleNewMessage = handleNewMessage;
ZwaveJSUIHandler.prototype.onNewDeviceDiscover = onNewDeviceDiscover;
ZwaveJSUIHandler.prototype.publish = publish;
ZwaveJSUIHandler.prototype.scan = scan;
ZwaveJSUIHandler.prototype.saveConfiguration = saveConfiguration;

module.exports = ZwaveJSUIHandler;
