const Promise = require('bluebird');
/**
 * @description Get all features states aggregates.
 * @param {Array} selectors - Array of device feature selectors.
 * @param {number} intervalInMinutes - Interval.
 * @param {number} maxStates - Number of elements to return max.
 * @param {Date} startDate - Start date.
 * @param {Date} endDate - End date.
 * @returns {Promise<Array>} - Resolve with an array of array of data.
 * @example
 * device.getDeviceFeaturesAggregates('test-devivce');
 */
async function getDeviceFeaturesAggregatesMulti(
  selectors,
  intervalInMinutes,
  maxStates = 100,
  startDate = null,
  endDate = null,
) {
  return Promise.map(
    selectors,
    async (selector) => {
      return this.getDeviceFeaturesAggregates(selector, intervalInMinutes, maxStates, startDate, endDate);
    },
    { concurrency: 4 },
  );
}

module.exports = {
  getDeviceFeaturesAggregatesMulti,
};
