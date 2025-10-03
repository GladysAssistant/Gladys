const dayjs = require('dayjs');

/**
 * @description Calculate energy monitoring cost every thirty minutes.
 * @param {string} jobId - The job id.
 * @returns {Promise<null>} Return when finished.
 * @example
 * calculateCostEveryThirtyMinutes('12345678-1234-1234-1234-1234567890ab');
 */
async function calculateCostEveryThirtyMinutes(jobId) {
  const thirtyMinutesAgo = dayjs()
    .subtract(30, 'minute')
    .toDate();
  await this.calculateCostFrom(thirtyMinutesAgo, jobId);
}

module.exports = {
  calculateCostEveryThirtyMinutes,
};
