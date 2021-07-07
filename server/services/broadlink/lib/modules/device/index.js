const { buildPeripheral } = require('./broadlink.device.buildPeripheral');
const { getPeripheralId } = require('./broadlink.device.getPeripheralId');
const { matchPeripheral } = require('./broadlink.device.matchPeripheral');
const { setValue } = require('./broadlink.device.setValue');

const BroadlinkDeviceHandler = function BroadlinkDeviceHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
};

BroadlinkDeviceHandler.prototype.buildPeripheral = buildPeripheral;
BroadlinkDeviceHandler.prototype.getPeripheralId = getPeripheralId;
BroadlinkDeviceHandler.prototype.matchPeripheral = matchPeripheral;
BroadlinkDeviceHandler.prototype.setValue = setValue;

module.exports = BroadlinkDeviceHandler;
