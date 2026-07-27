const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');
const { BadParameters } = require('../../utils/coreErrors');

/**
 * @description Save the Gladys Plus backup key.
 * @param {string} backupKey - The backup encryption key.
 * @returns {Promise} Resolve when the key is saved.
 * @example
 * saveBackupKey('my-backup-key');
 */
async function saveBackupKey(backupKey) {
  if (!backupKey || typeof backupKey !== 'string') {
    throw new BadParameters('BACKUP_KEY_REQUIRED');
  }
  await this.variable.setValue(SYSTEM_VARIABLE_NAMES.GLADYS_GATEWAY_BACKUP_KEY, backupKey);
}

module.exports = {
  saveBackupKey,
};
