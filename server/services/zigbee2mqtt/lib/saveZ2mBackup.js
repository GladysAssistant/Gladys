const logger = require('../../../utils/logger');
const { CONFIGURATION } = require('./constants');

/**
 * @description Save Z2M backup.
 * @param {Object} backup - Z2M service base64 ZIP backup.
 * @example
 * await z2m.saveZ2mBackup(base64Config);
 */
async function saveZ2mBackup(backup) {
  logger.info('Zigbee2mqtt: storing backup...');
  await this.gladys.variable.setValue(CONFIGURATION.Z2M_BACKUP, backup, this.serviceId);
  logger.info('Zigbee2mqtt: backup stored');
}

module.exports = {
  saveZ2mBackup,
};
