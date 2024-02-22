const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { STATUS, SUPPORTED_CATEGORY_TYPE } = require('./utils/netatmo.constants');

/**
 * @description Discover Netatmo cloud devices.
 * @returns {Promise} List of discovered devices;.
 * @example
 * await discoverDevices();
 */
async function discoverDevices() {
  logger.debug('Looking for Netatmo devices...');
  if (this.status !== STATUS.CONNECTED) {
    await this.saveStatus({ statusType: this.status, message: null });
    throw new ServiceNotConfiguredError('Unable to discover Netatmo devices until service is not well configured');
  }
  this.discoveredDevices = [];
  await this.saveStatus({ statusType: STATUS.DISCOVERING_DEVICES, message: null });

  let devicesNetatmo = [];
  try {
    devicesNetatmo = await this.loadDevices();
    logger.info(`${devicesNetatmo.length} Netatmo devices found`);
  } catch (e) {
    logger.error('Unable to load Netatmo devices', e);
  }
  if (devicesNetatmo.length > 0) {
    this.discoveredDevices = devicesNetatmo.map((device) => {
      let discoveredDevice;
      switch (device.categoryAPI) {
        case SUPPORTED_CATEGORY_TYPE.ENERGY: {
          discoveredDevice = this.convertDeviceEnergy(device);
          break;
        }
        case SUPPORTED_CATEGORY_TYPE.WEATHER: {
          discoveredDevice = this.convertDeviceWeather(device);
          break;
        }
        default:
          discoveredDevice = this.convertDeviceNotSupported(device);
          break;
      }
      return {
        ...discoveredDevice,
        service_id: this.serviceId,
        deviceNetatmo: device,
      };
    });
    const discoveredDevices = this.discoveredDevices.filter((device) => {
      const existInGladys = this.gladys.stateManager.get('deviceByExternalId', device.external_id);
      return existInGladys === null;
    });
    await this.saveStatus({ statusType: STATUS.CONNECTED, message: null });
    logger.debug(`${discoveredDevices.length} new Netatmo devices found`);
    return discoveredDevices;
  }
  await this.saveStatus({ statusType: STATUS.CONNECTED, message: null });
  logger.debug('No devices found');
  return [];
}

module.exports = {
  discoverDevices,
};
