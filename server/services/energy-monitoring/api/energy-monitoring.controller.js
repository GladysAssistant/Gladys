const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function EnergyMonitoringController(energyMonitoringHandler) {
  /**
   * @api {post} /api/v1/service/energy-monitoring/calculate-cost-from-beginning Calculate cost from beginning
   * @apiName calculateCostFromBeginning
   * @apiGroup EnergyMonitoring
   */
  async function calculateCostFromBeginning(req, res) {
    await energyMonitoringHandler.calculateCostFromBeginning();
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
    'get /api/v1/service/energy-monitoring/contracts': {
      authenticated: true,
      controller: asyncMiddleware(getContracts),
    },
  };
};
