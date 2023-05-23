const Promise = require('bluebird');

const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { setDeviceParam } = require('../../../../utils/setDeviceParam');

const { INFORMATION_SERVICES } = require('../device/bluetooth.information');
const { PARAMS } = require('../utils/bluetooth.constants');
const { read } = require('../utils/characteristic/bluetooth.read');

/**
 * @description Look for peripheral details.
 * @param {string} peripheralUuid - Perpiheral UUID.
 * @returns {Promise} All discovered promises.
 * @example
 * await bluetoothManager.scanDevice('0011223344');
 */
async function scanDevice(peripheralUuid) {
  logger.debug(`Bluetooth: scanning for device information on ${peripheralUuid}`);

  const device = this.discoveredDevices[peripheralUuid];

  setDeviceParam(device, PARAMS.LOADED, false);
  this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.DISCOVER,
    payload: device,
  });

  const loop = (peripheral) => {
    return Promise.map(
      Object.keys(INFORMATION_SERVICES),
      (serviceUuid) =>
        Promise.map(
          Object.keys(INFORMATION_SERVICES[serviceUuid]),
          async (characteristicUuid) => {
            try {
              const characteristic = await this.getCharacteristic(peripheral, serviceUuid, characteristicUuid);
              const actionMapper = INFORMATION_SERVICES[serviceUuid][characteristicUuid];
              if (actionMapper.discover) {
                actionMapper.discover(serviceUuid, characteristic, device);
              }

              if (actionMapper.read) {
                const value = await read(characteristic);
                return actionMapper.read(device, value);
              }
            } catch (e) {
              logger.warn(e.message);
            }

            return null;
          },
          { concurrency: 1 },
        ),
      { concurrency: 1 },
    );
  };

  try {
    await this.applyOnPeripheral(peripheralUuid, loop);
  } catch (e) {
    logger.warn(`Bluetooth: unable to scan ${peripheralUuid} - ${e}`);
  } finally {
    setDeviceParam(device, PARAMS.LOADED, true);
    this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.DISCOVER,
      payload: device,
    });
  }

  return device;
}

module.exports = {
  scanDevice,
};
