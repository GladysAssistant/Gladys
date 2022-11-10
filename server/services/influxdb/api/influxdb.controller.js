const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function InfluxdbController(influxdbManager) {
  /**
   * @api {post} /api/v1/service/influxdb/saveConfig Save InfluxDB connection
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
   * @api {get} /api/v1/service/influxdb/config Get InfluxDB configuration.
   * @apiName getConfiguration
   * @apiGroup InfluxDB
   */
  async function getConfiguration(req, res) {
    const configuration = await influxdbManager.getConfiguration();
    res.json(configuration);
  }

  /**
   * @api {post} /api/v1/service/influxdb/test Test connection
   * @apiName TestConnection
   * @apiGroup InfluxDB
   */
  async function testConnection(req, res) {
    const connectionStatus = await influxdbManager.testConnection(req.body);
    res.send(connectionStatus);
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
    'post /api/v1/service/influxdb/test': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(testConnection),
    },
  };
};
