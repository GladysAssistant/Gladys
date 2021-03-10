const logger = require('../../../../../../utils/logger');

const { BLUETOOTH } = require('../awox.mesh.constants');

const { command } = require('./utils/awox.mesh.ble.command');
const { generateCommandPacket } = require('../awox.mesh.commands');

/**
 * @description Send command to BLEMesh device over Bluetooth.
 * @param {Object} device - Gladys device.
 * @param {Object} deviceFeature - Device feature.
 * @param {number} value - Expected value.
 * @returns {Promise} Promise with send value.
 * @example
 * await bleMesh.setValue('d03975bc5a71', { type: 'binary' }, 1);
 */
async function setValue(device, deviceFeature, value) {
  const [, peripheralUuid] = device.external_id.split(':');
  logger.debug(`AwoX - BLEMesh: setting '${peripheralUuid}' device to '${value}' value...`);
  const actionCommand = command(deviceFeature, value);
  logger.debug(`AwoX - BLEMesh: set device value { code: ${actionCommand.code}, message: ${actionCommand.message} }`);

  return this.bluetooth.applyOnPeripheral(
    peripheralUuid,
    async (peripheral) => {
      // Get or generate session key
      const sessionKey = await this.getSessionKey(device, peripheral);
      const packet = generateCommandPacket(peripheralUuid, sessionKey, actionCommand);
      logger.debug(`AwoX - BLEMesh: set device packet: ${packet.toString('hex')}`);

      return this.bluetooth.writeDevice(peripheral, BLUETOOTH.SERVICE, BLUETOOTH.CHARACTERISTICS.COMMAND, packet, true);
    },
    true,
  );
}

module.exports = {
  setValue,
};
