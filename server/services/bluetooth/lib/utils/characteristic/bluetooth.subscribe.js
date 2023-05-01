const Promise = require('bluebird');

const logger = require('../../../../../utils/logger');
const { BadParameters } = require('../../../../../utils/coreErrors');

const { TIMERS } = require('../bluetooth.constants');

/**
 * @description Try to subscribe to Noble characteristic.
 * @param {object} characteristic - Noble characteristic.
 * @param {object} onNotify - Value callback.
 * @returns {Promise<object>} Subscrption status.
 * @example
 * await subscribe(characteristic, (value) => console.log(value));
 */
async function subscribe(characteristic, onNotify) {
  const properties = characteristic.properties || [];
  if (!properties.includes('notify') && !properties.includes('indicate')) {
    throw new BadParameters(`Bluetooth: not notify characteristic ${characteristic.uuid}`);
  }

  logger.trace(`Bluetooth: subscribing characteristic ${characteristic.uuid}`);

  return new Promise((resolve, reject) => {
    characteristic.subscribe((error) => {
      if (error) {
        return reject(new Error(`Bluetooth: failed to subscribe characteristic ${characteristic.uuid} - ${error}`));
      }

      characteristic.on('notify', (value) => onNotify(value));

      logger.debug(`Bluetooth: subscribed to characteristic ${characteristic.uuid}`);
      return resolve();
    });
  }).timeout(TIMERS.READ);
}

module.exports = {
  subscribe,
};
