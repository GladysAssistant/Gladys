const Promise = require('bluebird');
/**
 * @description Get all features states aggregates.
 * @param {Array} selectors - Array of device feature selectors.
 * @param {string} startInterval - Date of start.
 * @param {string} endInterval - Date of end.
 * @param {number} maxStates - Number of elements to return max.
 * @returns {Promise<Array>} - Resolve with an array of array of data.
 * @example
 * device.getDeviceFeaturesStates('test-devivce');
 */
async function getDeviceFeaturesStatesMulti(selectors, startInterval, endInterval, maxStates = 100) {
  return Promise.map(
    selectors,
    async (selector) => {
      return this.getDeviceFeaturesStates(selector, startInterval, endInterval, maxStates);
    },
    { concurrency: 4 },
  );
}

module.exports = {
  getDeviceFeaturesStatesMulti,
};
