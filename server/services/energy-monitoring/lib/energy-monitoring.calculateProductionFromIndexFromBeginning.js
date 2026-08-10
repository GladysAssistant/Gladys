const { ENERGY_FROM_INDEX_KINDS } = require('../utils/constants');

/**
 * @description Calculate production from index for all 30-minute windows from the beginning of the instance until now.
 * This function finds the oldest device state for production index devices and processes all 30-minute windows.
 * @param {string} jobId - The job id.
 * @returns {Promise<null>} Return null when finished.
 * @example
 * calculateProductionFromIndexFromBeginning('12345678-1234-1234-1234-1234567890ab');
 */
async function calculateProductionFromIndexFromBeginning(jobId) {
  return this.calculateEnergyFromIndexFromBeginning(ENERGY_FROM_INDEX_KINDS.PRODUCTION, jobId);
}

module.exports = {
  calculateProductionFromIndexFromBeginning,
};
