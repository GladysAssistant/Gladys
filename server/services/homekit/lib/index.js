const { createBridge } = require('./createBridge');
const { resetBridge } = require('./resetBridge');
const { buildAccessory } = require('./buildAccessory');
const { buildService } = require('./buildService');
const { newPinCode } = require('./newPinCode');
const { newUsername } = require('./newUsername');
const { notifyChange } = require('./notifyChange');
const { sendState } = require('./sendState');

/**
 * @description Add ability to connect to HomeKit.
 * @param {object} gladys - Gladys instance.
 * @param {string} serviceId - UUID of the service in DB.
 * @param {object} hap - UUID of the service in DB.
 * @example
 * const homekitHandler = new HomeKitHandler(gladys, serviceId, hap);
 */
const HomeKitHandler = function HomeKitHandler(gladys, serviceId, hap) {
  this.gladys = gladys;
  this.serviceId = serviceId;
  this.hap = hap;
  this.bridge = null;
  this.notifyTimeouts = {};
  this.notifyCb = null;
};

HomeKitHandler.prototype.newPinCode = newPinCode;
HomeKitHandler.prototype.newUsername = newUsername;
HomeKitHandler.prototype.createBridge = createBridge;
HomeKitHandler.prototype.resetBridge = resetBridge;
HomeKitHandler.prototype.buildAccessory = buildAccessory;
HomeKitHandler.prototype.buildService = buildService;
HomeKitHandler.prototype.notifyChange = notifyChange;
HomeKitHandler.prototype.sendState = sendState;

module.exports = HomeKitHandler;
