const asyncMiddleware = require('../middlewares/asyncMiddleware');

module.exports = function PingController() {
  /**
   * @api {get} /api/v1/ping ping
   * @apiName ping
   * @apiGroup Ping
   */
  async function ping(req, res) {
    res.json({ status: 200 });
  }

  return Object.freeze({
    ping: asyncMiddleware(ping),
  });
};
