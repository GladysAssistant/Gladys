const { init } = require('./broadlink.init');
const { discover } = require('./broadlink.discover');
const { stop } = require('./broadlink.stop');
const { addPeripheral } = require('./broadlink.addPeripheral');
const { getPeripherals } = require('./broadlink.getPeripherals');
const { learn } = require('./broadlink.learn');
const { cancelLearn } = require('./broadlink.cancelLearn');
const { send } = require('./broadlink.send');
const { setValue } = require('./broadlink.setValue');

/**
 * @description Add ability to connect to a Broadlink broker.
 * @param {Object} gladys - Gladys instance.
 * @param {Object} broadlink - Broadlink lib.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const broadlinkHandler = new BroadlinkHandler(gladys, client, serviceId);
 */
const BroadlinkHandler = function BroadlinkHandler(gladys, broadlink, serviceId) {
  this.gladys = gladys;
  this.broadlink = broadlink;
  this.serviceId = serviceId;

  this.broadlinkDevices = {};
  this.peripherals = {};
};

BroadlinkHandler.prototype.init = init;
BroadlinkHandler.prototype.discover = discover;
BroadlinkHandler.prototype.stop = stop;
BroadlinkHandler.prototype.addPeripheral = addPeripheral;
BroadlinkHandler.prototype.getPeripherals = getPeripherals;
BroadlinkHandler.prototype.learn = learn;
BroadlinkHandler.prototype.cancelLearn = cancelLearn;
BroadlinkHandler.prototype.send = send;
BroadlinkHandler.prototype.setValue = setValue;

module.exports = BroadlinkHandler;
