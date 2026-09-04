const logger = require('../../../utils/logger');

/**
 * @description Get all thermostat devices linked to this service.
 * @param {object} options - Optional filters: search, order_dir.
 * @returns {Promise<Array>} List of thermostat devices.
 * @example
 * await gladys.services.thermostat.device.getDevices({ search: 'salon', order_dir: 'desc' });
 */
async function getDevices(options = {}) {
  logger.info('Thermostat: Getting devices');
  const query = { service: 'thermostat' };
  if (options.search) {
    query.search = options.search;
  }
  if (options.order_dir) {
    query.order_dir = options.order_dir;
  }
  const devices = await this.gladys.device.get(query);
  return devices;
}

module.exports = { getDevices };
