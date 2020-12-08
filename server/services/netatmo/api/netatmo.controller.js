const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function NetatmoController(netatmoManager) {
    /**
     * @api {post} /api/v1/service/netatmo/connect Connect NETATMO connection
     * @apiName connect
     * @apiGroup Netatmo
     */
    async function connect(req, res) {
        await netatmoManager.connect()
        res.json({
            success: true,
        });
    }

    /**
     * @api {get} /api/v1/service/netatmo/sensor Get Netatmo sensors
     * @apiName getSensors
     * @apiGroup Netatmo
     */
    async function getDevices(req, res) {
      const sensors = await netatmoManager.getDevices();
      res.json(devices);
    }

    return {
        'post /api/v1/service/netatmo/connect': {
            authenticated: true,
            controller: asyncMiddleware(connect),
        },
        'get /api/v1/service/xiaomi/device': {
          authenticated: true,
          controller: asyncMiddleware(getDevices),
        },
    };
};
