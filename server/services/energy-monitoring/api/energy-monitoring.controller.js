const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const logger = require('../../../utils/logger');

module.exports = function EnergyMonitoringController(energyMonitoringHandler) {
  /**
   * @api {post} /api/v1/service/energy-monitoring/calculate-cost-from-beginning Calculate cost from beginning
   * @apiName calculateCostFromBeginning
   * @apiGroup EnergyMonitoring
   */
  async function calculateCostFromBeginning(req, res) {
    const featureSelectors = Array.isArray(req.body && req.body.feature_selectors)
      ? req.body.feature_selectors
      : [];
    logger.info(
      `[energy-monitoring] API calculate-cost-from-beginning selectors=${featureSelectors.length}`,
      featureSelectors,
    );
    energyMonitoringHandler.calculateCostFromBeginning(featureSelectors);
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/energy-monitoring/calculate-consumption-from-index-from-beginning
   * Calculate consumption from index from beginning
   * @apiName calculateConsumptionFromIndexFromBeginning
   * @apiGroup EnergyMonitoring
   */
  async function calculateConsumptionFromIndexFromBeginning(req, res) {
    const featureSelectors = Array.isArray(req.body && req.body.feature_selectors)
      ? req.body.feature_selectors
      : [];
    logger.info(
      `[energy-monitoring] API calculate-consumption-from-index-from-beginning selectors=${featureSelectors.length}`,
      featureSelectors,
    );
    energyMonitoringHandler.calculateConsumptionFromIndexFromBeginning(featureSelectors);
    res.json({
      success: true,
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
