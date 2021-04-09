const { buildPeripheral } = require('./broadlink.remote.buildPeripheral');
const { getPeripheralId } = require('./broadlink.remote.getPeripheralId');
const { matchPeripheral } = require('./broadlink.remote.matchPeripheral');
const { setValue } = require('./broadlink.remote.setValue');

const BroadlinkRemoteHandler = function BroadlinkRemoteHandler(gladys, serviceId) {
  this.gladys = gladys;
  this.serviceId = serviceId;
};

BroadlinkRemoteHandler.prototype.buildPeripheral = buildPeripheral;
BroadlinkRemoteHandler.prototype.getPeripheralId = getPeripheralId;
BroadlinkRemoteHandler.prototype.matchPeripheral = matchPeripheral;
BroadlinkRemoteHandler.prototype.setValue = setValue;

module.exports = BroadlinkRemoteHandler;
