const { queueWrapper } = require('../utils/queueWrapper');
const { floorToThirtyMinutes } = require('../utils/thirtyMinutesWindow');
const { SYSTEM_VARIABLE_NAMES } = require('../../../utils/constants');

/**
 * @description Calculate energy (consumption or production, depending on the kind) from index
 * every thirty minutes.
 * @param {object} kind - One of ENERGY_FROM_INDEX_KINDS (consumption or production).
 * @param {Date} now - The current date.
 * @param {string} jobId - The job id.
 * @returns {Promise<null>} Return when finished.
 * @example
 * calculateEnergyFromIndexThirtyMinutes(ENERGY_FROM_INDEX_KINDS.CONSUMPTION, new Date(), '12345678-...');
 */
async function calculateEnergyFromIndexThirtyMinutes(kind, now, jobId) {
  return queueWrapper(this.queue, async () => {
    // Round down to the nearest 30-minute mark (:00 or :30) in the system
    // timezone, so the scheduled path buckets to the same timestamps as the
    // from-beginning path whatever the timezone UTC offset.
    const systemTimezone = await this.gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE);
    const thirtyMinuteWindow = floorToThirtyMinutes(now, systemTimezone).toDate();
    // Dispatched through `this` so instance-level overrides (tests) still apply.
    await this[kind.calculateFromIndexMethod](thirtyMinuteWindow, jobId);
  });
}

module.exports = {
  calculateEnergyFromIndexThirtyMinutes,
};
