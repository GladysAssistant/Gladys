var netatmo = require('netatmo');
const { connect } = require('./commands/netatmo.connect.js');
const { getThermostat } = require('./commands/netatmo.getThermostat.js');
const { getNewThermostat } = require('./commands/netatmo.getNewThermostat.js');
const { setTemperatureThermostat } = require('./commands/netatmo.setTemperatureThermostat.js');
const { addDevice } = require('./commands/netatmo.addDevice.js');

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
    this.devices = {};
    this.connected = false;
    this.topicBinds = {};
    this.configured = false;
};

NetatmoManager.prototype.addDevice = addDevice;
NetatmoManager.prototype.connect = connect;
NetatmoManager.prototype.getThermostat = getThermostat;
NetatmoManager.prototype.getNewThermostat = getNewThermostat;
NetatmoManager.prototype.setTemperatureThermostat = setTemperatureThermostat;

module.exports = NetatmoManager;
