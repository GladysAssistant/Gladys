const Promise = require('bluebird');

const logger = require('../../../../../utils/logger');
const { BadParameters } = require('../../../../../utils/coreErrors');

const { TIMERS } = require('../bluetooth.constants');

/**
 * @description Try to connect to Noble peripheral.
 * @param {object} peripheral - Noble peripheral.
 * @returns {Promise<object>} Connected peripheral.
 * @example
 * await connect(peripheral);
 */
async function connect(peripheral) {
  if (!peripheral.connectable) {
    throw new BadParameters(`Bluetooth: Peripheral ${peripheral.uuid} not connectable`);
  }

  if (peripheral.state === 'connected') {
    return peripheral;
  }

  return new Promise((resolve, reject) => {
    logger.debug(`Bluetooth: connecting to peripheral ${peripheral.uuid}`);
    peripheral.connect((error) => {
      if (error) {
        logger.error(`Bluetooth: connection to peripheral ${peripheral.uuid} failed`);
        return reject(error);
      }

      logger.debug(`Bluetooth: connected to peripheral ${peripheral.uuid}`);
      return resolve(peripheral);
    });
  }).timeout(TIMERS.CONNECT);
}

module.exports = {
  connect,
};
