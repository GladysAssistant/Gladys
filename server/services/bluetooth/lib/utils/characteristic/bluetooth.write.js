const Promise = require('bluebird');

const logger = require('../../../../../utils/logger');
const { BadParameters } = require('../../../../../utils/coreErrors');

const { TIMERS } = require('../bluetooth.constants');

/**
 * @description Try to write Noble characteristic.
 * @param {object} characteristic - Noble characteristic.
 * @param {Array | Buffer} value - Value to send to peripheral.
 * @param {boolean} withoutResponse - Use "write without response" property (default false).
 * @returns {Promise<object>} Write value.
 * @example
 * await write(characteristic, [0x01]);
 */
async function write(characteristic, value, withoutResponse = false) {
  if (!(characteristic.properties || []).includes('write')) {
    throw new BadParameters(`Bluetooth: not writable characteristic ${characteristic.uuid}`);
  }

  logger.trace(`Bluetooth: writing characteristic ${characteristic.uuid}`);

  const commandBuffer = Buffer.isBuffer(value) ? value : Buffer.from(value);
  return new Promise((resolve, reject) => {
    characteristic.write(commandBuffer, withoutResponse, (error) => {
      if (error) {
        return reject(
          new Error(
            `Bluetooth: failed to write ${value.toString('hex')} on characteristic ${characteristic.uuid} - ${error}`,
          ),
        );
      }

      logger.debug(`Bluetooth: write ${value.toString('hex')} on characteristic ${characteristic.uuid}`);
      return resolve(value);
    });
  }).timeout(TIMERS.WRITE);
}

module.exports = {
  write,
};
