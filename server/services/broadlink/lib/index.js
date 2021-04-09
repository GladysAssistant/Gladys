const { init } = require('./commands/broadlink.init');
const { stop } = require('./commands/broadlink.stop');
const { getPeripherals } = require('./commands/broadlink.getPeripherals');
const { setValue } = require('./commands/broadlink.setValue');
const { addPeripheral } = require('./events/broadlink.addPeripheral');
const { learn } = require('./learn/broadlink.learn');
const { cancelLearn } = require('./learn/broadlink.cancelLearn');
const { send } = require('./learn/broadlink.send');

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

  this.handlers = [];
  this.learnTimers = {};

  this.broadlinkDevices = {};
  this.peripherals = {};

  this.addPeripheral = this.addPeripheral.bind(this);
};

BroadlinkHandler.prototype.init = init;
BroadlinkHandler.prototype.stop = stop;
BroadlinkHandler.prototype.getPeripherals = getPeripherals;
BroadlinkHandler.prototype.setValue = setValue;
BroadlinkHandler.prototype.addPeripheral = addPeripheral;
BroadlinkHandler.prototype.learn = learn;
BroadlinkHandler.prototype.cancelLearn = cancelLearn;
BroadlinkHandler.prototype.send = send;

module.exports = BroadlinkHandler;
