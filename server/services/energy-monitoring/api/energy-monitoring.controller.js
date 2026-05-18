const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { BadParameters } = require('../../../utils/coreErrors');

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * @description Validate a date string formatted as YYYY-MM-DD.
 * @param {string} value - Date candidate.
 * @returns {boolean} Return true if valid.
 */
function isValidDateString(value) {
  if (!DATE_PATTERN.test(value)) {
    return false;
  }
  const [year, month, day] = value.split('-').map((part) => Number(part));
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() + 1 === month && parsed.getUTCDate() === day;
}

/**
 * @description Read an optional date from request body and validate its format.
 * Empty values are treated as null.
 * @param {Object} body - Request body.
 * @param {string} field - Field name to read.
 * @returns {string|null} Return normalized date string or null.
 * @throws {BadParameters} Throw if provided value is not a valid YYYY-MM-DD date.
 */
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
   * @api {post} /api/v1/service/energy-monitoring/calculate-cost-range Calculate cost from a date range
   * @apiName calculateCostRange
   * @apiGroup EnergyMonitoring
   */
  async function calculateCostRange(req, res) {
    const featureSelectors = getFeatureSelectors(req.body);
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
    const featureSelectors = getFeatureSelectors(req.body);
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
