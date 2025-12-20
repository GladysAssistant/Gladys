const { queueWrapper } = require('../utils/queueWrapper');

/**
 * @description Calculate energy monitoring cost from the beginning or a date range.
 * @param {Date|string|null} startAt - Optional start date (YYYY-MM-DD or Date).
 * @param {Array<string>} featureSelectors - Optional whitelist of cost feature selectors.
 * @param {Date|string|null} endAt - Optional end date (YYYY-MM-DD or Date).
 * @param {string} jobId - The job id.
 * @returns {Promise<null>} Return when finished.
 * @example <caption>Recalculate full history</caption>
 * calculateCostFromBeginning(null, [], null, '12345678-1234-1234-1234-1234567890ab');
 */
async function calculateCostFromBeginning(startAt, featureSelectors, endAt, jobId) {
  const selectors = Array.isArray(featureSelectors)
    ? featureSelectors.filter((s) => typeof s === 'string' && s.length > 0)
    : [];

  return queueWrapper(this.queue, async () => {
    const finalStartAt = startAt || new Date(0);
    // Outer job controls progress; inner call runs without jobId to prevent double updates.
    await this.calculateCostFrom(finalStartAt, selectors, null, endAt);
  });
}

module.exports = {
  calculateCostFromBeginning,
};
