const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { BadParameters } = require('../../../utils/coreErrors');

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isValidDateString(value) {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map((part) => Number(part));
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return (
    parsed.getUTCFullYear() === year &&
    parsed.getUTCMonth() + 1 === month &&
    parsed.getUTCDate() === day
  );
}

function getOptionalDate(body, field) {
  const value = body && body[field];
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string' || !isValidDateString(value)) {
    throw new BadParameters(`${field} must be a valid date in YYYY-MM-DD format`);
  }
  return value;
}

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
    const startDate = getOptionalDate(req.body, 'start_date');
    const endDate = getOptionalDate(req.body, 'end_date');
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
    const startDate = getOptionalDate(req.body, 'start_date');
    const endDate = getOptionalDate(req.body, 'end_date');
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
