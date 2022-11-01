const logger = require('../../../utils/logger');
const { CONFIGURATION } = require('./constants');

/**
 * @description Get z2m backup.
 * @returns {Promise} Current z2m backup.
 * @example
 * getZ2mBackup();
 */
async function getZ2mBackup() {
  logger.debug('Zigbee2mqtt: loading z2m backup...');

  // Load z2m parameters
  return this.gladys.variable.getValue(CONFIGURATION.Z2M_BACKUP, this.serviceId);
}

module.exports = {
  getZ2mBackup,
};
