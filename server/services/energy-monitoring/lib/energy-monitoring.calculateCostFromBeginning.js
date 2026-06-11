const { queueWrapper } = require('../utils/queueWrapper');

/**
 * @description Calculate energy monitoring cost from the beginning.
 * @param {Array<string>} featureSelectors - Optional whitelist of cost feature selectors.
 * @param {string} jobId - The job id.
 * @returns {Promise<null>} Return when finished.
 * @example <caption>Recalculate full history</caption>
 * calculateCostFromBeginning(null, [], null, '12345678-1234-1234-1234-1234567890ab');
 */
async function calculateCostFromBeginning(featureSelectors, jobId) {
  const selectors = Array.isArray(featureSelectors)
    ? featureSelectors.filter((s) => typeof s === 'string' && s.length > 0)
    : [];

  return queueWrapper(this.queue, async () => {
    await this.calculateCostFrom(new Date(0), selectors, jobId);
  });
}

module.exports = {
  calculateCostFromBeginning,
};
