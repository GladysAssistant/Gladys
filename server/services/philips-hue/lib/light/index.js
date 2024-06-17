const Bottleneck = require('bottleneck/es5');

const { activateScene } = require('./light.activateScene');
const { configureBridge } = require('./light.configureBridge');
const { getBridges } = require('./light.getBridges');
const { init } = require('./light.init');
const { poll } = require('./light.poll');
const { getLights } = require('./light.getLights');
const { getScenes } = require('./light.getScenes');
const { setValue } = require('./light.setValue');
const { syncWithBridge } = require('./light.syncWithBridge');

// we rate-limit the number of request per seconds to poll lights
const pollLimiter = new Bottleneck({
  maxConcurrent: 1,
  minTime: 100, // 100 ms
});

// we rate-limit the number of request per seconds to control lights
const setValueLimiter = new Bottleneck({
  minTime: 100, // 100 ms
});

/**
 * @description Add ability to control a Philips Hue light.
 * @param {object} gladys - Gladys instance.
 * @param {object} hueClient - Philips Hue Client.
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
  this.bridgesByIP = new Map();
  this.hueApisBySerialNumber = new Map();
  this.lights = [];
};

PhilipsHueLightHandler.prototype.activateScene = activateScene;
PhilipsHueLightHandler.prototype.configureBridge = configureBridge;
PhilipsHueLightHandler.prototype.getBridges = getBridges;
PhilipsHueLightHandler.prototype.init = init;
PhilipsHueLightHandler.prototype.poll = pollLimiter.wrap(poll);
PhilipsHueLightHandler.prototype.getLights = getLights;
PhilipsHueLightHandler.prototype.getScenes = getScenes;
PhilipsHueLightHandler.prototype.setValue = setValueLimiter.wrap(setValue);
PhilipsHueLightHandler.prototype.syncWithBridge = syncWithBridge;

module.exports = PhilipsHueLightHandler;
