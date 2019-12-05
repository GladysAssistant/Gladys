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
     * @api {get} /api/v1/service/netatmo/thermostat Get NETATMO thermostat information
     * @apiName thermostat
     * @apiGroup Netatmo
     */
    async function getThermostat(req, res) {
        const response = await netatmoManager.getThermostat();
        res.json(response);
    }

    /**
     * @api {post} /api/v1/service/netatmo/thermostat Post NETATMO thermostat temperature
     * @apiName thermostat
     * @apiGroup Netatmo
     */
    async function setTemperatureThermostat(req, res) {
        await netatmoManager.setTemperatureThermostat(req.body.device_id, req.body.module_id, req.body.setpoint_temp);
    }

    return {
        'post /api/v1/service/netatmo/connect': {
            authenticated: true,
            controller: asyncMiddleware(connect),
        },
        'get /api/v1/service/netatmo/thermostat': {
            authenticated: true,
            controller: asyncMiddleware(getThermostat),
        },
        'post /api/v1/service/netatmo/thermostat/temperature': {
            authenticated: true,
            controller: asyncMiddleware(setTemperatureThermostat),
        },
    };
};