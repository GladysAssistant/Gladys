var netatmo = require('netatmo');
const { connect } = require('./commands/netatmo.connect.js');
const { getDevice } = require('./commands/netatmo.get.device.js');

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

NetatmoManager.prototype.connect = connect;
NetatmoManager.prototype.getDevice = getDevice;

module.exports = NetatmoManager;
