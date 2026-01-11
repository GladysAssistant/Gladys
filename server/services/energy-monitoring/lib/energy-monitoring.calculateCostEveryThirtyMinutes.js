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

module.exports = {
  calculateCostEveryThirtyMinutes,
};
