const Promise = require('bluebird');
/**
 * @description Get all features states.
 * @param {Array} selectors - Array of device feature selectors.
 * @param {number} intervalInMinutes - Interval.
 * @param {number} maxStates - Number of elements to return max.
 * @param {Date} [startDate] - Start date.
 * @param {Date} [endDate] - End date.
 * @returns {Promise<Array>} - Resolve with an array of array of data.
 * @example
 * device.getDeviceFeaturesStatesMulti('test-device');
 */
async function getDeviceFeaturesStatesMulti(selectors, intervalInMinutes, maxStates = 10000, startDate = null, endDate = null) {
  console.log('getDeviceFeaturesStatesMulti', selectors, intervalInMinutes, maxStates, startDate, endDate);
  return Promise.map(
    selectors,
    async (selector) => {
      return this.getDeviceFeaturesStates(selector, intervalInMinutes, maxStates, startDate, endDate);
    },
    { concurrency: 4 },
  );
}

module.exports = {
  getDeviceFeaturesStatesMulti,
};
