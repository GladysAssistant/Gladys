const Promise = require('bluebird');
/**
 * @description Get all features states aggregates.
 * @param {Array} selectors - Array of device feature selectors.
 * @param {object} options - Options object.
 * @param {number} [options.intervalInMinutes] - Interval in minutes (legacy approach).
 * @param {Date} [options.from] - Start date for date range approach.
 * @param {Date} [options.to] - End date for date range approach.
 * @param {number} [options.maxStates=100] - Number of elements to return max.
 * @param {string} [options.groupBy] - Group results by time period ('hour', 'day', 'week', 'month', 'year').
 * @returns {Promise<Array>} - Resolve with an array of array of data.
 * @example
 * device.getDeviceFeaturesAggregates('test-devivce');
 */
async function getDeviceFeaturesAggregatesMulti(selectors, options) {
  return Promise.map(
    selectors,
    async (selector) => {
      return this.getDeviceFeaturesAggregates(selector, options);
    },
    { concurrency: 4 },
  );
}

module.exports = {
  getDeviceFeaturesAggregatesMulti,
};
