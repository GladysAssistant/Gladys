const dayjs = require('dayjs');
const { queueWrapper } = require('../utils/queueWrapper');

/**
 * @description Calculate energy monitoring cost every thirty minutes.
 * @param {Date} now - The current date.
 * @param {string} jobId - The job id.
 * @returns {Promise<null>} Return when finished.
 * @example
 * calculateCostEveryThirtyMinutes(new Date(), '12345678-1234-1234-1234-1234567890ab');
 */
async function calculateCostEveryThirtyMinutes(now, jobId) {
  return queueWrapper(this.queue, async () => {
    const thirtyMinutesAgo = dayjs(now)
      .subtract(30, 'minute')
      .toDate();
    await this.calculateCostFrom(thirtyMinutesAgo, null, jobId, now);
  });
}

/**
 * @description Build job data (scope/period) for the thirty-minute cost calculation.
 * @param {Date} now - Current date/time used to compute the 30-minute window.
 * @returns {object} Job data payload with scope, period and kind.
 * @example
 * buildCostThirtyMinutesJobData(new Date());
 */
function buildCostThirtyMinutesJobData(now) {
  const endDate = new Date(now);
  const startDate = dayjs(endDate)
    .subtract(30, 'minute')
    .toDate();
  return {
    scope: 'all',
    period: {
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
    },
    kind: 'cost',
  };
}

module.exports = {
  calculateCostEveryThirtyMinutes,
  buildCostThirtyMinutesJobData,
};
