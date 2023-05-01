const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const { transformToDevice } = require('../device/bluetooth.transformToDevice');

/**
 * @description When the Bluetooth discovers peripheral, add it to managed peripherals.
 * @param {object} noblePeripheral - Noble peripheral.
 * @example
 * bluetooth.on('discover', this.discover);
 */
function discover(noblePeripheral) {
  logger.trace(`Bluetooth: discover ${noblePeripheral.uuid}`);

  // Store device if not already there
  if (!this.peripheralLookup && !this.discoveredDevices[noblePeripheral.uuid]) {
    const device = transformToDevice(noblePeripheral);
    this.discoveredDevices[noblePeripheral.uuid] = device;

    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.DISCOVER,
      payload: this.completeDevice(device),
    });
  }
}

module.exports = {
  discover,
};
