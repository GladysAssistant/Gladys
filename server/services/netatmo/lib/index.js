const Bottleneck = require('bottleneck/es5');

// commands
const { connect } = require('./commands/netatmo.connect.js');
const { getSensors } = require('./commands/netatmo.getSensors.js');
const { getDevices } = require('./commands/netatmo.getDevices.js');
const { addSensor } = require('./commands/netatmo.addSensor.js');
const { getThermostatsData } = require('./commands/netatmo.getThermostatsData.js');
const { getHomeStatusData } = require('./commands/netatmo.getHomeStatusData.js');
const { getHomeData } = require('./commands/netatmo.getHomeData.js');
const { getStationsData } = require('./commands/netatmo.getStationsData.js');
const { getHealthyHomeCoachData } = require('./commands/netatmo.getHealthyHomeCoachData.js');

// event
const { newValueThermostat } = require('./event/netatmo.newValueThermostat.js');
const { newValueStation } = require('./event/netatmo.newValueStation.js');
const { newValueHomeCoach } = require('./event/netatmo.newValueHomeCoach.js');
const { newValueSmokeDetector } = require('./event/netatmo.newValueSmokeDetector.js');
const { newValueCamera } = require('./event/netatmo.newValueCamera.js');
const { newValueValve } = require('./event/netatmo.newValueValve.js');
const { poll } = require('./event/netatmo.poll.js');

// we rate-limit the number of request per seconds to poll lights
const pollLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 100, // 100 ms
});

/**
 * @param {Object} gladys - The gladys object.
 * @param {string} serviceId - Identification of the service.
 * @description Create all device if not exist
 * @example
 * NetatmoManager(gladys, serviceId)
 */
const NetatmoManager = function NetatmoManager(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.sensors = {};
  this.devices = {};
  this.connected = false;
  this.topicBinds = {};
  this.configured = false;
  this.baseUrl = 'https://api.netatmo.net';
  this.token = undefined;
};

NetatmoManager.prototype.connect = connect;
NetatmoManager.prototype.getSensors = getSensors;
NetatmoManager.prototype.getDevices = getDevices;
NetatmoManager.prototype.addSensor = addSensor;
NetatmoManager.prototype.getThermostatsData = getThermostatsData;
NetatmoManager.prototype.getHomeStatusData = getHomeStatusData;
NetatmoManager.prototype.getHomeData = getHomeData;
NetatmoManager.prototype.getStationsData = getStationsData;
NetatmoManager.prototype.getHealthyHomeCoachData = getHealthyHomeCoachData;

NetatmoManager.prototype.newValueThermostat = newValueThermostat;
NetatmoManager.prototype.newValueStation = newValueStation;
NetatmoManager.prototype.newValueHomeCoach = newValueHomeCoach;
NetatmoManager.prototype.newValueSmokeDetector = newValueSmokeDetector;
NetatmoManager.prototype.newValueCamera = newValueCamera;
NetatmoManager.prototype.newValueValve = newValueValve;
NetatmoManager.prototype.poll = pollLimiter.wrap(poll);

module.exports = NetatmoManager;
