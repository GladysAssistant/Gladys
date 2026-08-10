const { ENERGY_FROM_INDEX_KINDS } = require('../utils/constants');

/**
 * @description Calculate consumption from index every thirty minutes.
 * @param {Date} now - The current date.
 * @param {string} jobId - The job id.
 * @returns {Promise<null>} Return when finished.
 * @example
 * calculateConsumptionFromIndexThirtyMinutes(new Date(), '12345678-1234-1234-1234-1234567890ab');
 */
async function calculateConsumptionFromIndexThirtyMinutes(now, jobId) {
  return this.calculateEnergyFromIndexThirtyMinutes(ENERGY_FROM_INDEX_KINDS.CONSUMPTION, now, jobId);
}

module.exports = {
  calculateConsumptionFromIndexThirtyMinutes,
};
