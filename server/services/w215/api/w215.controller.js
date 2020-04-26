const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function W215Controller(w215Handler) {
  /**
   * @api {get} /api/v1/service/pw215/bridge Get DSP-W215 devices on found in the network
   * @apiName devices
   * @apiGroup W215
   */
  async function discover(req, res) {
    const devices = await w215Handler.discover();
    res.json(devices);
  }

  async function testConnection(req, res) {
    const status = await w215Handler.testConnection(req.body);
    res.send(status);
  }

  return {
    'get /api/v1/service/w215/discover': {
      authenticated: true,
      controller: asyncMiddleware(discover),
    },
    'post /api/v1/service/w215/test': {
      authenticated: true,
      controller: asyncMiddleware(testConnection),
    },
  };
};
