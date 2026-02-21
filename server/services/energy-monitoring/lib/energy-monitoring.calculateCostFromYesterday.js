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

module.exports = {
  calculateCostFromYesterday,
};
