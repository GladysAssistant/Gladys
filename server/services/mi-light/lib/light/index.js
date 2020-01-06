const { configureBridge } = require('./light.configureBridge');
const { getBridges } = require('./light.getBridges');
const { getZones } = require('./light.getZones');
const { setValue } = require('./light.setValue');
const { init } = require('./light.init');

/**
 * @description Add ability to control a MiLight light
 * @param {Object} gladys - Gladys instance.
 * @param {Object} milightClient - Mi Light Client.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const exampleLightHandler = new ExampleLightHandler(gladys, client, serviceId);
 */
const MiLightLightHandler = function MiLightLightHandler(gladys, milightClient, serviceId) {
  this.gladys = gladys;
  this.milightClient = milightClient;
  this.serviceId = serviceId;
  this.bridges = [];
  this.connectedBridges = [];
  this.bridgesByMac = new Map();
  this.lights = [];
};

MiLightLightHandler.prototype.configureBridge = configureBridge;
MiLightLightHandler.prototype.init = init;
MiLightLightHandler.prototype.getBridges = getBridges;
MiLightLightHandler.prototype.getZones = getZones;
MiLightLightHandler.prototype.setValue = setValue;

module.exports = MiLightLightHandler;