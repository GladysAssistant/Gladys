var netatmo = require('netatmo');

// commands
const { connect } = require('./commands/netatmo.connect.js');
const { getDevice } = require('./commands/netatmo.getDevice.js');
const { addDevice } = require('./commands/netatmo.addDevice.js');

// event
const { newValueThermostat } = require('./event/newValueThermostat.js');

/**
 * @param {Object} gladys - The gladys object.
 * @param {string} serviceId - Identification of the service.
 * @description Create all device if not exist by listening
 * @example
 * NetatmoManager(gladys, serviceId)
 */
const NetatmoManager = function NetatmoManager(gladys, serviceId) {
    this.gladys = gladys;
    this.serviceId = serviceId;
    this.netatmo = netatmo;
    this.api = undefined;
    this.devices = {};
    this.connected = false;
    this.topicBinds = {};
    this.configured = false;
};

NetatmoManager.prototype.connect = connect;
NetatmoManager.prototype.getDevice = getDevice;
NetatmoManager.prototype.addDevice = addDevice;

NetatmoManager.prototype.newValueThermostat = newValueThermostat;

module.exports = NetatmoManager;
