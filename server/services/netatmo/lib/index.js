var netatmo = require('netatmo');
const Bottleneck = require('bottleneck/es5');

// commands
const { connect } = require('./commands/netatmo.connect.js');
const { getSensors } = require('./commands/netatmo.getSensors.js');
const { getDevices } = require('./commands/netatmo.getDevices.js');
const { addSensor } = require('./commands/netatmo.addSensor.js');

// event
const { newValueThermostat } = require('./event/newValueThermostat.js');
const { poll } = require('./event/netatmo.poll.js');

// we rate-limit the number of request per seconds to poll lights
const pollLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 100, // 100 ms
});

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
    this.sensors = {};
    this.devices = {};
    this.connected = false;
    this.topicBinds = {};
    this.configured = false;
};

NetatmoManager.prototype.connect = connect;
NetatmoManager.prototype.getSensors = getSensors;
NetatmoManager.prototype.getDevices = getDevices;
NetatmoManager.prototype.addSensor = addSensor;

NetatmoManager.prototype.newValueThermostat = newValueThermostat;
NetatmoManager.prototype.poll = pollLimiter.wrap(poll);

module.exports = NetatmoManager;
