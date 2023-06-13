const Promise = require('bluebird');
const crypto = require('crypto');

const randomBytes = Promise.promisify(crypto.randomBytes);

const BACKUP_KEY_LENGTH = 64;

/**
 * @private
 * @description Generate a backup key.
 * @example
 * const key = await generateBackupKey();
 * @returns {Promise} Resolving with the key.
 */
async function generateBackupKey() {
  const apiKey = (await randomBytes(Math.ceil(BACKUP_KEY_LENGTH / 2))).toString('hex').slice(0, BACKUP_KEY_LENGTH);
  return apiKey;
}

module.exports = {
  generateBackupKey,
};
