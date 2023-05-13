const { init } = require('./commands/broadlink.init');
const { stop } = require('./commands/broadlink.stop');
const { buildPeripheral } = require('./commands/broadlink.buildPeripheral');
const { getPeripherals } = require('./commands/broadlink.getPeripherals');
const { loadMapper } = require('./commands/broadlink.loadMapper');
const { getDevice } = require('./commands/broadlink.getDevice');
const { setValue } = require('./commands/broadlink.setValue');
const { poll } = require('./commands/broadlink.poll');
const { addPeripheral } = require('./commands/broadlink.addPeripheral');
const { learn } = require('./learn/broadlink.learn');
const { checkData } = require('./learn/broadlink.checkData');
const { cancelLearn } = require('./learn/broadlink.cancelLearn');
const { send } = require('./learn/broadlink.send');

/**
 * @description Add ability to connect to a Broadlink broker.
 * @param {object} gladys - Gladys instance.
 * @param {object} broadlink - Broadlink lib.
 * @param {string} serviceId - UUID of the service in DB.
 * @example
 * const broadlinkHandler = new BroadlinkHandler(gladys, client, serviceId);
 */
const BroadlinkHandler = function BroadlinkHandler(gladys, broadlink, serviceId) {
  this.gladys = gladys;
  this.broadlink = broadlink;
  this.serviceId = serviceId;

  this.learnTimers = {};

  this.broadlinkDevices = {};
  this.peripherals = {};
};

BroadlinkHandler.prototype.init = init;
BroadlinkHandler.prototype.stop = stop;
BroadlinkHandler.prototype.buildPeripheral = buildPeripheral;
BroadlinkHandler.prototype.getPeripherals = getPeripherals;
BroadlinkHandler.prototype.loadMapper = loadMapper;
BroadlinkHandler.prototype.getDevice = getDevice;
BroadlinkHandler.prototype.setValue = setValue;
BroadlinkHandler.prototype.poll = poll;
BroadlinkHandler.prototype.addPeripheral = addPeripheral;
BroadlinkHandler.prototype.learn = learn;
BroadlinkHandler.prototype.checkData = checkData;
BroadlinkHandler.prototype.cancelLearn = cancelLearn;
BroadlinkHandler.prototype.send = send;

module.exports = BroadlinkHandler;
