const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function EnergyMonitoringController(energyMonitoringHandler) {
  /**
   * @api {post} /api/v1/service/energy-monitoring/calculate-cost-from-beginning Calculate cost from beginning
   * @apiName calculateCostFromBeginning
   * @apiGroup EnergyMonitoring
   */
  async function calculateCostFromBeginning(req, res) {
    const featureSelectors = Array.isArray(req.body && req.body.feature_selectors) ? req.body.feature_selectors : [];
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
    const featureSelectors = Array.isArray(req.body && req.body.feature_selectors) ? req.body.feature_selectors : [];
    const job = await energyMonitoringHandler.calculateConsumptionFromIndexFromBeginning(featureSelectors);
    res.json({
      success: true,
      job_id: job && job.id,
    });
  }

  /**
   * @api {post} /api/v1/service/energy-monitoring/calculate-cost-range Calculate cost from a date range
   * @apiName calculateCostRange
   * @apiGroup EnergyMonitoring
   */
  async function calculateCostRange(req, res) {
    const featureSelectors = Array.isArray(req.body && req.body.feature_selectors) ? req.body.feature_selectors : [];
    const startDate = req.body && req.body.start_date;
    const endDate = req.body && req.body.end_date;
    const job = await energyMonitoringHandler.calculateCostRange(startDate, featureSelectors, endDate);
    res.json({
      success: true,
      job_id: job && job.id,
    });
  }

  /**
   * @api {post} /api/v1/service/energy-monitoring/calculate-consumption-from-index-range
   * Calculate consumption from index from a date range
   * @apiName calculateConsumptionFromIndexRange
   * @apiGroup EnergyMonitoring
   */
  async function calculateConsumptionFromIndexRange(req, res) {
    const featureSelectors = Array.isArray(req.body && req.body.feature_selectors) ? req.body.feature_selectors : [];
    const startDate = req.body && req.body.start_date;
    const endDate = req.body && req.body.end_date;
    const job = await energyMonitoringHandler.calculateConsumptionFromIndexRange(startDate, featureSelectors, endDate);
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
    'post /api/v1/service/energy-monitoring/calculate-cost-range': {
      authenticated: true,
      controller: asyncMiddleware(calculateCostRange),
    },
    'post /api/v1/service/energy-monitoring/calculate-consumption-from-index-range': {
      authenticated: true,
      controller: asyncMiddleware(calculateConsumptionFromIndexRange),
    },
    'get /api/v1/service/energy-monitoring/contracts': {
      authenticated: true,
      controller: asyncMiddleware(getContracts),
    },
  };
};
