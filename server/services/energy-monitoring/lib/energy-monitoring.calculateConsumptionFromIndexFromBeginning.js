const { ENERGY_FROM_INDEX_KINDS } = require('../utils/constants');

/**
 * @description Calculate consumption from index for all 30-minute windows from the beginning of the instance until now.
 * This function finds the oldest device state for energy index devices and processes all 30-minute windows.
 * @param {string} jobId - The job id.
 * @returns {Promise<null>} Return null when finished.
 * @example
 * calculateConsumptionFromIndexFromBeginning('12345678-1234-1234-1234-1234567890ab');
 */
async function calculateConsumptionFromIndexFromBeginning(jobId) {
  return this.calculateEnergyFromIndexFromBeginning(ENERGY_FROM_INDEX_KINDS.CONSUMPTION, jobId);
}

module.exports = {
  calculateConsumptionFromIndexFromBeginning,
};
