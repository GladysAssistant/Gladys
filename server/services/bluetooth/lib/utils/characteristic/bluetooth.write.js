const Promise = require('bluebird');

const logger = require('../../../../../utils/logger');
const { BadParameters } = require('../../../../../utils/coreErrors');

const { TIMERS } = require('../bluetooth.constants');

/**
 * @description Try to write Noble characteristic.
 * @param {Object} characteristic - Noble characteristic.
 * @param {Array | Buffer} value - Value to send to peripheral.
 * @returns {Promise<Object>} Write value.
 * @example
 * await write(characteristic, [0x01]);
 */
async function write(characteristic, value) {
  if (!(characteristic.properties || []).includes('write')) {
    throw new BadParameters(`Bluetooth: not writable characteristic ${characteristic.uuid}`);
  }

  logger.trace(`Bluetooth: writing characteristic ${characteristic.uuid}`);

  const commandBuffer = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return new Promise((resolve, reject) => {
    characteristic.write(commandBuffer, false, (error) => {
      if (error) {
        reject(new Error(`Bluetooth: failed to write ${value} on characteristic ${characteristic.uuid} - ${error}`));
      }

      logger.debug(`Bluetooth: write ${value} on characteristic ${characteristic.uuid}`);
      resolve(value);
    });
  }).timeout(TIMERS.WRITE);
}

module.exports = {
  write,
};
