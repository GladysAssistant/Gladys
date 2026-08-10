const { queueWrapper } = require('../utils/queueWrapper');

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
    const minutes = now.getMinutes();
    const thirtyMinuteWindow = new Date(now);

    // Round to the nearest 30-minute mark (00:00 or 00:30)
    if (minutes < 30) {
      thirtyMinuteWindow.setMinutes(0, 0, 0);
    } else {
      thirtyMinuteWindow.setMinutes(30, 0, 0);
    }
    // Dispatched through `this` so instance-level overrides (tests) still apply.
    await this[kind.calculateFromIndexMethod](thirtyMinuteWindow, jobId);
  });
}

module.exports = {
  calculateEnergyFromIndexThirtyMinutes,
};
