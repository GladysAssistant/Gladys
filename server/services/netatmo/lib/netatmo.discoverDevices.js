const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { STATUS } = require('./utils/netatmo.constants');
const { convertDevice } = require('./device/netatmo.convertDevice');

/**
 * @description Discover Netatmo cloud devices.
 * @param {object} netatmoHandler - Netatmo handler.
 * @returns {Promise} List of discovered devices;.
 * @example
 * await discoverDevices(netatmoHandler);
 */
async function discoverDevices(netatmoHandler) {
  logger.debug('Looking for Netatmo devices...');
  if (netatmoHandler.status !== STATUS.CONNECTED) {
    netatmoHandler.saveStatus({ statusType: netatmoHandler.status, message: null });
    throw new ServiceNotConfiguredError('Unable to discover Netatmo devices until service is not well configured');
  }
  // Reset already discovered devices
  netatmoHandler.discoveredDevices = [];
  await netatmoHandler.saveStatus({ statusType: STATUS.DISCOVERING_DEVICES, message: null });

  let devicesNetatmo = [];
  try {
    devicesNetatmo = await netatmoHandler.loadDevices();
    console.log(devicesNetatmo);
    logger.info(`${devicesNetatmo.length} Netatmo devices found`);
  } catch (e) {
    logger.error('Unable to load Netatmo devices', e);
  }
  if (devicesNetatmo.length > 0) {
    netatmoHandler.discoveredDevices = devicesNetatmo.map((device) => ({
      ...convertDevice(device),
      service_id: netatmoHandler.serviceId,
      deviceNetatmo: device,
    }));

    console.log(netatmoHandler.discoveredDevices);
    const discoveredDevices = netatmoHandler.discoveredDevices.filter((device) => {
      const existInGladys = netatmoHandler.gladys.stateManager.get('deviceByExternalId', device.external_id);
      return existInGladys === null;
    });
    console.log(discoveredDevices);
    netatmoHandler.saveStatus({ statusType: STATUS.CONNECTED, message: null });
    return discoveredDevices;
  }
  return [];
}

module.exports = {
  discoverDevices,
};
