const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function LGTVController(lgtvHandler) {
  /**
   * @api {post} /api/v1/service/lgtv/scan
   * @apiName Scan
   * @apiGroup LGTV
   */
  async function scan(req, res) {
    const foundDevices = await lgtvHandler.scan();
    res.send(foundDevices);
  }

  /**
   * @api {post} /api/v1/service/lgtv/device create
   * @apiName create
   * @apiGroup Device
   */
  async function create(req, res) {
    const device = await lgtvHandler.create(req.body);
    res.json(device);
  }

  return {
    'post /api/v1/service/lgtv/scan': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(scan),
    },
    'post /api/v1/service/lgtv/device': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(create),
    },
  };
};
