const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { BadParameters } = require('../../../utils/coreErrors');

/**
 * @description Read and validate feature selectors from request body.
 * Missing/null values are treated as an empty array.
 * @param {Object} body - Request body.
 * @returns {Array<string>} Return normalized feature selectors.
 * @throws {BadParameters} Throw if provided value is not an array of non-empty strings.
 */
function getFeatureSelectors(body) {
  const value = body && body.feature_selectors;
  if (value === undefined || value === null) {
    return [];
  }
  if (!Array.isArray(value)) {
    throw new BadParameters('feature_selectors must be an array of non-empty strings');
  }
  const selectors = value.map((selector) => (typeof selector === 'string' ? selector.trim() : selector));
  const hasInvalidSelector = selectors.some((selector) => typeof selector !== 'string' || selector.length === 0);
  if (hasInvalidSelector) {
    throw new BadParameters('feature_selectors must be an array of non-empty strings');
  }
  return selectors;
}

module.exports = function EnergyMonitoringController(energyMonitoringHandler) {
  /**
   * @api {post} /api/v1/service/energy-monitoring/calculate-cost-from-beginning Calculate cost from beginning
   * @apiName calculateCostFromBeginning
   * @apiGroup EnergyMonitoring
   */
  async function calculateCostFromBeginning(req, res) {
    const featureSelectors = getFeatureSelectors(req.body);
    const job = await energyMonitoringHandler.calculateCostFromBeginning(featureSelectors);
    res.json({
      success: true,
      job_id: job && job.id,
    });
  }

  /**
   * @api {post} /api/v1/service/energy-monitoring/calculate-consumption-from-index-from-beginning
   * Calculate consumption from index from beginning
   * @apiName calculateConsumptionFromIndexFromBeginning
   * @apiGroup EnergyMonitoring
   */
  async function calculateConsumptionFromIndexFromBeginning(req, res) {
    const featureSelectors = getFeatureSelectors(req.body);
    const job = await energyMonitoringHandler.calculateConsumptionFromIndexFromBeginning(featureSelectors);
    res.json({
      success: true,
      job_id: job && job.id,
    });
  }

  /**
   * @api {get} /api/v1/service/energy-monitoring/contracts Get energy contracts
   * @apiName getContracts
   * @apiGroup EnergyMonitoring
   */
  async function getContracts(req, res) {
    const contracts = await energyMonitoringHandler.getContracts();
    res.json(contracts);
  }

  return {
    'post /api/v1/service/energy-monitoring/calculate-cost-from-beginning': {
      authenticated: true,
      controller: asyncMiddleware(calculateCostFromBeginning),
    },
    'post /api/v1/service/energy-monitoring/calculate-consumption-from-index-from-beginning': {
      authenticated: true,
      controller: asyncMiddleware(calculateConsumptionFromIndexFromBeginning),
    },
    'get /api/v1/service/energy-monitoring/contracts': {
      authenticated: true,
      controller: asyncMiddleware(getContracts),
    },
  };
};
