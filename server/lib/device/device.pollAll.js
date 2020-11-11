const Promise = require('bluebird'); 

/**
 * @description Poll all devices of one frequency.
 * @param {number} pollFrequency - The frequency in milliseconds.
 * @returns {function()} Return a function.
 * @example
 * pollAll(60000);
 */
function pollAll(pollFrequency) {
  return async () => { 
    if (this.devicesByPollFrequency[pollFrequency]) { 
      return Promise.map(this.devicesByPollFrequency[pollFrequency], (device) => this.poll(device));
    }
    return Promise.resolve();
  };
}

module.exports = {
  pollAll,
};
