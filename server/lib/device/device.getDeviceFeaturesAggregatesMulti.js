const Promise = require('bluebird');
/**
 * @description Get all features states aggregates.
 * @param {Array} selectors - Array of device feature selectors.
 * @param {number} intervalInMinutes - Interval.
 * @param {number} [maxStates] - Number of elements to return max.
 * @param {string} [groupBy] - Group results by time period ('hour', 'day', 'week', 'month', 'year').
 * @param {number} [offsetInMinutes] - Offset in minutes from now for the end of the interval.
 * @returns {Promise<Array>} - Resolve with an array of array of data.
 * @example
 * device.getDeviceFeaturesAggregates('test-devivce');
 */
async function getDeviceFeaturesAggregatesMulti(
  selectors,
  intervalInMinutes,
  maxStates = 100,
  groupBy = null,
  offsetInMinutes = 0,
) {
  return Promise.map(
    selectors,
    async (selector) => {
      return this.getDeviceFeaturesAggregates(selector, intervalInMinutes, maxStates, groupBy, offsetInMinutes);
    },
    { concurrency: 4 },
  );
}

module.exports = {
  getDeviceFeaturesAggregatesMulti,
};
