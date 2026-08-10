const { ENERGY_FROM_INDEX_KINDS } = require('../utils/constants');

/**
 * @description Calculate thirty-minute production from index differences for devices that have
 * production INDEX features with corresponding THIRTY_MINUTES_PRODUCTION features (linked via energy_parent_id).
 * @param {Date} thirtyMinutesWindowTime - The specific time for the thirty-minute window.
 * @param {string} jobId - The job id.
 * @returns {Promise<null>} Return null when finished.
 * @example
 * calculateProductionFromIndex(new Date(), '12345678-1234-1234-1234-1234567890ab');
 */
async function calculateProductionFromIndex(thirtyMinutesWindowTime, jobId) {
  return this.calculateEnergyFromIndex(ENERGY_FROM_INDEX_KINDS.PRODUCTION, thirtyMinutesWindowTime, jobId);
}

module.exports = {
  calculateProductionFromIndex,
};
