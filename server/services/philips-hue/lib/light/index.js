const { configureBridge } = require('./light.configureBridge');
const { getBridges } = require('./light.getBridges');
const { init } = require('./light.init');
const { poll } = require('./light.poll');
const { getLights } = require('./light.getLights');
const { setValue } = require('./light.setValue');

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
  this.LightState = hueClient.lightStates.LightState;
  this.serviceId = serviceId;
  this.bridges = [];
  this.connnectedBridges = [];
  this.bridgesBySerialNumber = new Map();
  this.hueApisBySerialNumber = new Map();
  this.lights = [];
};

PhilipsHueLightHandler.prototype.configureBridge = configureBridge;
PhilipsHueLightHandler.prototype.getBridges = getBridges;
PhilipsHueLightHandler.prototype.init = init;
PhilipsHueLightHandler.prototype.poll = poll;
PhilipsHueLightHandler.prototype.getLights = getLights;
PhilipsHueLightHandler.prototype.setValue = setValue;

module.exports = PhilipsHueLightHandler;
