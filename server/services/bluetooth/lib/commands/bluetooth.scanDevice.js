const Promise = require('bluebird');

const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { setDeviceParam } = require('../../../../utils/setDeviceParam');

const { INFORMATION_SERVICES } = require('../device/bluetooth.information');
const { PARAMS } = require('../utils/bluetooth.constants');
const { read } = require('../utils/characteristic/bluetooth.read');
const { getCharacteristic } = require('../utils/bluetooth.getCharacteristic');

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
          (characteristicUuid) => {
            return getCharacteristic(peripheral, serviceUuid, characteristicUuid)
              .then((characteristic) => {
                const actionMapper = INFORMATION_SERVICES[serviceUuid][characteristicUuid];

                if (actionMapper.discover) {
                  actionMapper.discover(serviceUuid, characteristic, device);
                }

                if (actionMapper.read) {
                  return read(characteristic).then((value) => actionMapper.read(device, value));
                }

                return Promise.resolve();
              })
              .catch((e) => {
                logger.warn(e.message);
                return Promise.resolve();
              });
          },
          { concurrency: 1 },
        ),
      { concurrency: 1 },
    );
  };

  return this.applyOnPeripheral(peripheralUuid, loop)
    .catch((error) => logger.warn(`Bluetooth: unable to scan ${peripheralUuid} - ${error}`))
    .finally(() => {
      setDeviceParam(device, PARAMS.LOADED, true);
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.BLUETOOTH.DISCOVER,
        payload: device,
      });
      return device;
    });
}

module.exports = {
  scanDevice,
};
