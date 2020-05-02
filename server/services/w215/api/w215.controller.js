const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function W215Controller(w215Handler) {
  /**
   * @api {get} /api/v1/service/w215/discover Get DSP-W215 devices on found in the network
   * @apiName discover
   * @apiGroup W215
   */
  async function discover(req, res) {
    const devices = await w215Handler.discover();
    res.json(devices);
  }

  /**
   * @api {post} /api/v1/service/w215/test Test connection to the smart plug
   * @apiName testConnection
   * @apiParam {String} serial Device index
   * @apiGroup W215
   */
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
