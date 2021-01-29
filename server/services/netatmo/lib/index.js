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
// update
const { updateNetatmo } = require('./update/netatmo.updateNetatmo.js');
const { updateFeature } = require('./update/netatmo.update.js');
const { updateCamera } = require('./update/netatmo.updateCamera.js');
const { updateThermostat } = require('./update/netatmo.updateThermostat.js');
const { updateHomeCoachWeather } = require('./update/netatmo.updateHomeCoachWeather.js');
const { updateNHC } = require('./update/netatmo.updateNHC.js');
const { updateWeatherStation } = require('./update/netatmo.updateWeatherStation.js');

// event
const { newValueThermostat } = require('./event/netatmo.newValueThermostat.js');
const { newValueStation } = require('./event/netatmo.newValueStation.js');
const { newValueHomeCoach } = require('./event/netatmo.newValueHomeCoach.js');
const { newValueSmokeDetector } = require('./event/netatmo.newValueSmokeDetector.js');
const { newValueCamera } = require('./event/netatmo.newValueCamera.js');
const { newValueValve } = require('./event/netatmo.newValueValve.js');
const { pollManual } = require('./event/netatmo.pollManual.js');

const { DEVICE_POLL_FREQUENCIES } = require('../../../utils/constants');
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
  this.pollFrequencies = DEVICE_POLL_FREQUENCIES;
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

NetatmoManager.prototype.updateNetatmo = updateNetatmo;
NetatmoManager.prototype.updateFeature = updateFeature;
NetatmoManager.prototype.updateCamera = updateCamera;
NetatmoManager.prototype.updateThermostat = updateThermostat;
NetatmoManager.prototype.updateHomeCoachWeather = updateHomeCoachWeather;
NetatmoManager.prototype.updateNHC = updateNHC;
NetatmoManager.prototype.updateWeatherStation = updateWeatherStation;

NetatmoManager.prototype.newValueThermostat = newValueThermostat;
NetatmoManager.prototype.newValueStation = newValueStation;
NetatmoManager.prototype.newValueHomeCoach = newValueHomeCoach;
NetatmoManager.prototype.newValueSmokeDetector = newValueSmokeDetector;
NetatmoManager.prototype.newValueCamera = newValueCamera;
NetatmoManager.prototype.newValueValve = newValueValve;
NetatmoManager.prototype.pollManual = pollManual;

module.exports = NetatmoManager;
