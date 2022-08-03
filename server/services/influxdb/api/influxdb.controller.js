const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function InfluxdbController(influxdbManager) {
  /**
   * @api {post} /api/v1/service/influxdb/saveConfig Save MQTT connection
   * @apiName save
   * @apiGroup InfluxDB
   */
  async function saveConfig(req, res) {
    await influxdbManager.saveConfiguration(req.body);
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/service/influxdb/config Get MQTT configuration.
   * @apiName getConfiguration
   * @apiGroup InfluxDB
   */
  async function getConfiguration(req, res) {
    const configuration = await influxdbManager.getConfiguration();
    res.json(configuration);
  }

  return {
    'post /api/v1/service/influxdb/saveConfig': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(saveConfig),
    },
    'get /api/v1/service/influxdb/config': {
      authenticated: true,
      controller: asyncMiddleware(getConfiguration),
    },
  };
};
