const Promise = require('bluebird');

const logger = require('../../../../../utils/logger');
const { BadParameters } = require('../../../../../utils/coreErrors');

const { TIMERS } = require('../bluetooth.constants');

/**
 * @description Try to read Noble characteristic.
 * @param {object} characteristic - Noble characteristic.
 * @returns {Promise<object>} Read value.
 * @example
 * await read(characteristic);
 */
async function read(characteristic) {
  if (!(characteristic.properties || []).includes('read')) {
    throw new BadParameters(`Bluetooth: not readable characteristic ${characteristic.uuid}`);
  }

  logger.trace(`Bluetooth: reading characteristics ${characteristic.uuid}`);

  return new Promise((resolve, reject) => {
    characteristic.read((error, data) => {
      if (error) {
        return reject(new Error(`Bluetooth: failed to read characteristic ${characteristic.uuid} - ${error}`));
      }

      logger.debug(`Bluetooth: read ${data.toString('hex')} on characteristic ${characteristic.uuid}`);
      return resolve(data);
    });
  }).timeout(TIMERS.READ);
}

module.exports = {
  read,
};
