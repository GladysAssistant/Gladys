const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function EcowattController(getSignals) {
  /**
   * @api {get} /api/v1/service/ecowatt/signals Get ecowatt signals
   * @apiName getSignals
   * @apiGroup Ecowatt
   */
  async function getSignalsController(req, res) {
    const data = await getSignals();
    res.json(data);
  }

  return {
    'get /api/v1/service/ecowatt/signals': {
      authenticated: true,
      controller: asyncMiddleware(getSignalsController),
    },
  };
};
