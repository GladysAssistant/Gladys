const { ENERGY_FROM_INDEX_KINDS } = require('../utils/constants');

/**
 * @description Calculate thirty-minute consumption from index differences for devices that have
 * INDEX features with corresponding THIRTY_MINUTES_CONSUMPTION features (linked via energy_parent_id).
 * @param {Date} thirtyMinutesWindowTime - The specific time for the thirty-minute window.
 * @param {string} jobId - The job id.
 * @returns {Promise<null>} Return null when finished.
 * @example
 * calculateConsumptionFromIndex(new Date(), '12345678-1234-1234-1234-1234567890ab');
 */
async function calculateConsumptionFromIndex(thirtyMinutesWindowTime, jobId) {
  return this.calculateEnergyFromIndex(ENERGY_FROM_INDEX_KINDS.CONSUMPTION, thirtyMinutesWindowTime, jobId);
}

module.exports = {
  calculateConsumptionFromIndex,
};
