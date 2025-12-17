const { queueWrapper } = require('../utils/queueWrapper');

/**
 * @description Calculate energy monitoring cost from the beginning.
 * @param {Array} featureSelectors - Optional whitelist of cost feature selectors to process.
 * @param {string} jobId - The job id.
 * @returns {Promise<null>} Return when finished.
 * @example
 * calculateCostFromBeginning([], '12345678-1234-1234-1234-1234567890ab');
 */
async function calculateCostFromBeginning(featureSelectors = [], jobId) {
  // Backward compatibility: wrapper injects jobId as last arg; scheduled calls may omit selectors
  if (jobId === undefined && typeof featureSelectors === 'string') {
    jobId = featureSelectors;
    featureSelectors = [];
  }
  const selectors = Array.isArray(featureSelectors)
    ? featureSelectors.filter((s) => typeof s === 'string' && s.length > 0)
    : [];
  this.gladys && this.gladys.job && this.gladys.job.start && this.gladys.job.finish; // placeholder to keep linter happy if needed
  const logger = require('../../../utils/logger');
  logger.info(
    `[energy-monitoring] calculateCostFromBeginning scope=${selectors.length === 0 ? 'all' : 'selection'} selectors=${
      selectors.length
    }`,
  );

  return queueWrapper(this.queue, async () => {
    await this.calculateCostFrom(new Date(0), selectors, jobId);
  });
}

module.exports = {
  calculateCostFromBeginning,
};
