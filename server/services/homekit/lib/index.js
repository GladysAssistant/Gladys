const { createBridge } = require('./createbridge');
const { buildAccessory } = require('./buildAccessory');
const { buildService } = require('./buildService');
const { newPinCode } = require('./newPinCode');

/**
 * @description Add ability to connect to HomeKit.
 * @param {Object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @param {Object} hap - UUID of the service in DB.
 * @example
 * const homekitHandler = new HomeKitHandler(gladys, serviceId, hap);
 */
const HomeKitHandler = function HomeKitHandler(gladys, serviceId, hap) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.hap = hap;
};

HomeKitHandler.prototype.newPinCode = newPinCode;
HomeKitHandler.prototype.createBridge = createBridge;
HomeKitHandler.prototype.buildAccessory = buildAccessory;
HomeKitHandler.prototype.buildService = buildService;

module.exports = HomeKitHandler;
