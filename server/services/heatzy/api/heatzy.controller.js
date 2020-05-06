const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function HeatzyController(heatzyManager) {
  /**
   * @api {post} /api/v1/service/heatzy/save Save Heatzy connection
   * @apiName save
   * @apiGroup Heatzy
   */
  async function connect(req, res) {
    const { heatzyLogin, heatzyPassword } = req.body;
    await heatzyManager.connect(heatzyLogin, heatzyPassword);
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/heatzy/discover Get discovered Heatzy devices
   * @apiName discover
   * @apiGroup Heatzy
   */
  function discover(req, res) {
    heatzyManager.discoverDevices();
    res.json({ status: 'discovering' });
  }

  /**
   * @api {get} /api/v1/service/heatzy/status Get Heatzy connection status.
   * @apiName status
   * @apiGroup Heatzy
   */
  async function status(req, res) {
    const response = await heatzyManager.status();
    res.json(response);
  }

  return {
    'post /api/v1/service/heatzy/connect': {
      authenticated: true,
      controller: asyncMiddleware(connect),
    },
    'post /api/v1/service/heatzy/discover': {
      authenticated: true,
      controller: discover,
    },
    'get /api/v1/service/heatzy/status': {
      authenticated: true,
      controller: status,
    },
  };
};
