const { queueWrapper } = require('../utils/queueWrapper');

/**
 * @description Calculate energy monitoring cost from yesterday.
 * @param {Date} yesterdayDate - Yesterday date at midnight.
 * @param {string} jobId - The job id.
 * @returns {Promise<null>} Return when finished.
 * @example
 * calculateCostFromYesterday(new Date(), '12345678-1234-1234-1234-1234567890ab');
 */
async function calculateCostFromYesterday(yesterdayDate, jobId) {
  return queueWrapper(this.queue, async () => {
    await this.calculateCostFrom(yesterdayDate, null, jobId, null);
  });
}

/**
 * @description Build job data (scope/period) for the “yesterday” cost calculation.
 * @param {Date} yesterdayDate - Date (midnight) used as start of the range.
 * @returns {object} Job data payload with scope, period and kind.
 * @example
 * buildCostYesterdayJobData(new Date());
 */
function buildCostYesterdayJobData(yesterdayDate) {
  return {
    scope: 'all',
    period: {
      start_date: (yesterdayDate || new Date()).toISOString(),
      end_date: null,
    },
    kind: 'cost',
  };
}

module.exports = {
  calculateCostFromYesterday,
  buildCostYesterdayJobData,
};
