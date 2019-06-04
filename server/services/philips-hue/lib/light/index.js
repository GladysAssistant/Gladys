const { configureBridge } = require('./light.configureBridge');
const { discoverBridge } = require('./light.discoverBridge');
const { getBridges } = require('./light.getBridges');
const { turnOn } = require('./light.turnOn');
const { turnOff } = require('./light.turnOff');

/**
 * @description Add ability to control a Philips Hue light
 * @param {Object} gladys - Gladys instance.
 * @param {Object} hueClient - Philips Hue Client.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const philipsHueLightHandler = new PhilipsHueLightHandler(gladys, client, serviceId);
 */
const PhilipsHueLightHandler = function PhilipsHueLightHandler(gladys, hueClient, serviceId) {
  this.gladys = gladys;
  this.hueClient = hueClient;
  this.lightState = hueClient.lightState;
  this.serviceId = serviceId;
  this.hueApi = null;
};

/**
 * @description Reconnect to the philips hue bridge.
 * @param {string} ipAddress - IP Address of the Philips Hue Bridge.
 * @param {string} userId - User ID used to connect.
 * @example
 * init('162.198.1.1', 'OBUHKAP7FPRCnEhZOMp1P33TvTQLvthgEHd3SH-g');
 */
async function init(ipAddress, userId) {
  const { HueApi } = this.hueClient;
  this.hueApi = new HueApi(ipAddress, userId);
}

PhilipsHueLightHandler.prototype.configureBridge = configureBridge;
PhilipsHueLightHandler.prototype.discoverBridge = discoverBridge;
PhilipsHueLightHandler.prototype.getBridges = getBridges;
PhilipsHueLightHandler.prototype.turnOn = turnOn;
PhilipsHueLightHandler.prototype.turnOff = turnOff;
PhilipsHueLightHandler.prototype.init = init;

module.exports = PhilipsHueLightHandler;
