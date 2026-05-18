const { queueWrapper } = require('../utils/queueWrapper');

/**
 * @description Calculate energy monitoring cost every thirty minutes.
 * @param {Date} now - The current date.
 * @param {string} jobId - The job id.
 * @returns {Promise<null>} Return when finished.
 * @example
 * calculateConsumptionFromIndexThirtyMinutes(new Date(), '12345678-1234-1234-1234-1234567890ab');
 */
async function calculateConsumptionFromIndexThirtyMinutes(now, jobId) {
  return queueWrapper(this.queue, async () => {
    const minutes = now.getMinutes();
    const thirtyMinuteWindow = new Date(now);

    // Round to the nearest 30-minute mark (00:00 or 00:30)
    if (minutes < 30) {
      thirtyMinuteWindow.setMinutes(0, 0, 0);
    } else {
      thirtyMinuteWindow.setMinutes(30, 0, 0);
    }
    await this.calculateConsumptionFromIndex(thirtyMinuteWindow, null, jobId);
  });
}

module.exports = {
  calculateConsumptionFromIndexThirtyMinutes,
};
