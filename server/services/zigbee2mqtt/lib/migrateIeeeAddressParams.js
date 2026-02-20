const logger = require('../../../utils/logger');
const { convertDevice } = require('../utils/convertDevice');

/**
 * @description Re-create each discovered device already registered in Gladys via gladys.device.create(),
 *   so that new params (e.g. ieee_address) are upserted using the standard device update flow.
 * @returns {Promise} Resolve when migration is done.
 * @example
 * await z2m.migrateIeeeAddressParams();
 */
async function migrateIeeeAddressParams() {
  const migratePromises = Object.values(this.discoveredDevices)
    .filter((device) => device.ieee_address)
    .map(async (device) => {
      const existingDevice = this.gladys.stateManager.get('deviceByExternalId', `zigbee2mqtt:${device.friendly_name}`);
      if (!existingDevice) {
        return;
      }
      const alreadyHasParam = existingDevice.params && existingDevice.params.some((p) => p.name === 'ieee_address');
      if (alreadyHasParam) {
        return;
      }
      try {
        const gladysDevice = convertDevice(device, this.serviceId);
        await this.gladys.device.create(gladysDevice);
      } catch (e) {
        logger.error(`Zigbee2mqtt: failed to migrate ieee_address for ${device.friendly_name}:`, e);
      }
    });

  await Promise.all(migratePromises);
}

module.exports = {
  migrateIeeeAddressParams,
};
