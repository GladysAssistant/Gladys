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

/**
 * @description Build job data (scope/period) for the thirty-minute consumption calculation.
 * @param {Date} now - Current date/time used to compute the 30-minute window.
 * @returns {object} Job data payload with scope and period.
 * @example
 * buildConsumptionThirtyMinutesJobData(new Date());
 */
function buildConsumptionThirtyMinutesJobData(now) {
  const rounded = new Date(now);
  const minutes = rounded.getMinutes();
  if (minutes < 30) {
    rounded.setMinutes(0, 0, 0);
  } else {
    rounded.setMinutes(30, 0, 0);
  }
  const windowEnd = rounded.toISOString();
  const windowStart = new Date(rounded.getTime() - 30 * 60 * 1000).toISOString();
  return {
    scope: 'all',
    period: {
      start_date: windowStart,
      end_date: windowEnd,
    },
  };
}

module.exports = {
  calculateConsumptionFromIndexThirtyMinutes,
  buildConsumptionThirtyMinutesJobData,
};
