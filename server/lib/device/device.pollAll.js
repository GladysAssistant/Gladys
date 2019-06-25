const Promise = require('bluebird');
const logger = require('../../utils/logger');

/**
 * @description Poll all devices of one frequency.
 * @param {number} pollFrequency - The frequency in milliseconds.
 * @returns {function()} Return a function.
 * @example
 * pollAll(60000);
 */
function pollAll(pollFrequency) {
  return async () => {
    logger.debug(`Device : pollAll : Polling all device of frequency = ${pollFrequency}`);
    if (this.devicesByPollFrequency[pollFrequency]) {
      return Promise.map(this.devicesByPollFrequency[pollFrequency], (device) => this.poll(device));
    }
    return Promise.resolve();
  };
}

module.exports = {
  pollAll,
};
