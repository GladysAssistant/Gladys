const Promise = require('bluebird');

const logger = require('../../../../../utils/logger');
const { BadParameters } = require('../../../../../utils/coreErrors');

const { TIMERS } = require('../bluetooth.constants');

/**
 * @description Try to unsubscribe to Noble characteristic.
 * @param {object} characteristic - Noble characteristic.
 * @returns {Promise<object>} Unscribsciption status.
 * @example
 * await subscribe(characteristic);
 */
async function unsubscribe(characteristic) {
  const properties = characteristic.properties || [];
  if (!properties.includes('notify') && !properties.includes('indicate')) {
    throw new BadParameters(`Bluetooth: not notify characteristic ${characteristic.uuid}`);
  }

  logger.trace(`Bluetooth: unsubscribing characteristic ${characteristic.uuid}`);

  return new Promise((resolve, reject) => {
    characteristic.unsubscribe((error) => {
      if (error) {
        return reject(new Error(`Bluetooth: failed to unsubscribe characteristic ${characteristic.uuid} - ${error}`));
      }

      logger.debug(`Bluetooth: unsubscribed to characteristic ${characteristic.uuid}`);
      return resolve();
    });
  }).timeout(TIMERS.READ);
}

module.exports = {
  unsubscribe,
};
