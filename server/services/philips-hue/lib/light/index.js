const { configureBridge } = require('./light.configureBridge');
const { getBridges } = require('./light.getBridges');
const { getLightsFromBridge } = require('./light.getLightsFromBridge');
const { turnOn } = require('./light.turnOn');
const { turnOff } = require('./light.turnOff');

/**
 * @description Add ability to control a Philips Hue light
 * @param {Object} gladys - Gladys instance.
 * @param {Object} hueClient - Philips Hue Client.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const exampleLightHandler = new ExampleLightHandler(gladys, client, serviceId);
 */
const PhilipsHueLightHandler = function PhilipsHueLightHandler(gladys, hueClient, serviceId) {
  this.gladys = gladys;
  this.hueClient = hueClient;
  this.lightState = hueClient.lightState;
  this.serviceId = serviceId;
  this.hueApi = null;
};

PhilipsHueLightHandler.prototype.configureBridge = configureBridge;
PhilipsHueLightHandler.prototype.getBridges = getBridges;
PhilipsHueLightHandler.prototype.getLightsFromBridge = getLightsFromBridge;
PhilipsHueLightHandler.prototype.turnOn = turnOn;
PhilipsHueLightHandler.prototype.turnOff = turnOff;

module.exports = PhilipsHueLightHandler;
