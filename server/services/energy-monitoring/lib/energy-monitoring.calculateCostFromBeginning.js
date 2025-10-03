/**
 * @description Calculate energy monitoring cost from the beginning.
 * @param {string} jobId - The job id.
 * @returns {Promise<null>} Return when finished.
 * @example
 * calculateCostFromBeginning('12345678-1234-1234-1234-1234567890ab');
 */
async function calculateCostFromBeginning(jobId) {
  await this.calculateCostFrom(new Date(0), jobId);
}

module.exports = {
  calculateCostFromBeginning,
};
