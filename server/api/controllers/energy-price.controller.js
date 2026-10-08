const asyncMiddleware = require('../middlewares/asyncMiddleware');

// The energy prices are read-only since the energy contracts (docs/specs/energy-contracts.md,
// section 9.4): GET answers from the contracts for two releases, writes point to the new API.
const GONE_MESSAGE = 'The energy_price API is read-only: use /api/v1/energy_contract';

/**
 * @description Energy price REST controller (compatibility window).
 * @param {object} gladys - Gladys service container.
 * @returns {object} Controller handlers.
 * @example
 * EnergyPriceController(gladys);
 */
module.exports = function EnergyPriceController(gladys) {
  /**
   * @api {get} /api/v1/energy_price get
   * @apiName get
   * @apiGroup EnergyPrice
   * @apiDescription Legacy price rows projected from the energy contracts.
   */
  async function get(req, res) {
    const prices = await gladys.energyContract.getLegacyPrices(req.query || {});
    res.json(prices);
  }

  /**
   * @api {post} /api/v1/energy_price gone
   * @apiName gone
   * @apiGroup EnergyPrice
   * @apiDescription 410: prices are managed through the energy contracts.
   */
  async function gone(req, res) {
    res.status(410).json({ status: 410, code: 'GONE', message: GONE_MESSAGE });
  }

  /**
   * @api {get} /api/v1/energy_price/default_electric_meter_feature_id getDefaultElectricMeterFeatureId
   * @apiName getDefaultElectricMeterFeatureId
   * @apiGroup EnergyPrice
   */
  async function getDefaultElectricMeterFeatureId(req, res) {
    const featureId = await gladys.energyContract.getDefaultElectricMeterFeatureId();
    res.json({ feature_id: featureId });
  }

  return Object.freeze({
    get: asyncMiddleware(get),
    gone: asyncMiddleware(gone),
    getDefaultElectricMeterFeatureId: asyncMiddleware(getDefaultElectricMeterFeatureId),
  });
};
