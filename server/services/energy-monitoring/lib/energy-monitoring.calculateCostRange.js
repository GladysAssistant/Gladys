const { queueWrapper } = require('../utils/queueWrapper');

/**
 * @description Calculate energy monitoring cost on a date range. Both bounds are optional:
 * missing start falls back to Epoch, missing end falls back to now (legacy behavior).
 * @param {Date|string|null} startAt - Optional start date (YYYY-MM-DD string or Date).
 * @param {Array<string>} featureSelectors - Optional whitelist of cost feature selectors.
 * @param {Date|string|null} endAt - Optional end date (YYYY-MM-DD string or Date).
 * @param {string} jobId - The job id.
 * @returns {Promise<null>} Return when finished.
 * @example <caption>Recalculate a date range for all features</caption>
 * calculateCostRange('2025-01-01', [], '2025-06-01', '12345678-1234-1234-1234-1234567890ab');
 */
async function calculateCostRange(startAt, featureSelectors, endAt, jobId) {
  const selectors = Array.isArray(featureSelectors)
    ? featureSelectors.filter((s) => typeof s === 'string' && s.length > 0)
    : [];

  return queueWrapper(this.queue, async () => {
    const finalStartAt = startAt || new Date(0);
    await this.calculateCostFrom(finalStartAt, selectors, jobId, endAt);
  });
}

module.exports = {
  calculateCostRange,
};
