const Promise = require('bluebird');
/**
 * @description Get all features states aggregates.
 * @param {Array} selectors - Array of device feature selectors.
 * @param {number} intervalInMinutes - Interval.
 * @param {number} [maxStates] - Number of elements to return max.
 * @param {string} [groupBy] - Group results by time period ('hour', 'day', 'week', 'month', 'year').
 * @returns {Promise<Array>} - Resolve with an array of array of data.
 * @example
 * device.getDeviceFeaturesAggregates('test-devivce');
 */
async function getDeviceFeaturesAggregatesMulti(selectors, intervalInMinutes, maxStates = 100, groupBy = null) {
  return Promise.map(
    selectors,
    async (selector) => {
      return this.getDeviceFeaturesAggregates(selector, intervalInMinutes, maxStates, groupBy);
    },
    { concurrency: 4 },
  );
}

module.exports = {
  getDeviceFeaturesAggregatesMulti,
};
