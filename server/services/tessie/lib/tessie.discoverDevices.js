const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { STATUS, SUPPORTED_CATEGORY_TYPE } = require('./utils/tessie.constants');

/**
 * @description Discover Tessie vehicles.
 * @returns {Promise} List of discovered vehicles.
 * @example
 * await discoverDevices();
 */
async function discoverDevices() {
  logger.debug('Looking for Tessie vehicles...');
  if (this.status !== STATUS.CONNECTED) {
    await this.saveStatus({ statusType: this.status, message: null });
    throw new ServiceNotConfiguredError('Unable to discover Tessie vehicles until service is not well configured');
  }
  this.discoveredDevices = [];
  await this.saveStatus({ statusType: STATUS.DISCOVERING_DEVICES, message: null });

  let vehicles = [];
  try {
    vehicles = await this.loadVehicles();
    logger.info(`${vehicles.length} Tessie vehicles found`);
  } catch (e) {
    logger.error('Unable to load Tessie vehicles', e);
  }
  if (vehicles.length > 0) {
    this.discoveredDevices = vehicles.map((vehicle) => {
      const discoveredDevice = this.convertVehicle(vehicle);
      return {
        ...discoveredDevice,
        service_id: this.serviceId,
        vehicleData: vehicle,
      };
    });
    const discoveredDevices = this.discoveredDevices.filter((device) => {
      const existInGladys = this.gladys.stateManager.get('deviceByExternalId', device.external_id);
      return existInGladys === null;
    });
    await this.saveStatus({ statusType: STATUS.CONNECTED, message: null });
    logger.debug(`${discoveredDevices.length} new Tessie vehicles found`);
    return discoveredDevices;
  }
  await this.saveStatus({ statusType: STATUS.CONNECTED, message: null });
  logger.debug('No vehicles found');
  return [];
}

module.exports = {
  discoverDevices,
};
