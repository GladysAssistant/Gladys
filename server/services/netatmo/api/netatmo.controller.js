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

    return {
        'post /api/v1/service/netatmo/connect': {
            authenticated: true,
            controller: asyncMiddleware(connect),
        },
    };
};
