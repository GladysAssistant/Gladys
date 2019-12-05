var netatmo = require('netatmo');
const { init } = require('./init.js');
const { connect } = require('./commands/netatmo.connect.js');
const { getThermostat } = require('./commands/netatmo.getThermostat.js');
const { setTemperatureThermostat } = require('./commands/netatmo.setTemperatureThermostat.js');

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
    this.connected = false;
    this.topicBinds = {};
    this.configured = false;
};

NetatmoManager.prototype.init = init;
NetatmoManager.prototype.connect = connect;
NetatmoManager.prototype.getThermostat = getThermostat;
NetatmoManager.prototype.setTemperatureThermostat = setTemperatureThermostat;

module.exports = NetatmoManager;