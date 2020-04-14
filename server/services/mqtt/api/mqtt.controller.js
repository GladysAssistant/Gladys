const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { DEFAULT } = require('../lib/constants');

module.exports = function MqttController(mqttManager) {
  /**
   * @api {post} /api/v1/service/mqtt/save Save MQTT connection
   * @apiName save
   * @apiGroup Mqtt
   */
  async function connect(req, res) {
    await mqttManager.connect(req.body);
    await mqttManager.saveConfiguration(req.body);
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/service/mqtt/status Get MQTT connection status.
   * @apiName status
   * @apiGroup Mqtt
   */
  async function status(req, res) {
    const response = await mqttManager.status();
    res.json(response);
  }

  /**
   * @api {get} /api/v1/service/mqtt/config Get MQTT configuration.
   * @apiName getConfiguration
   * @apiGroup Mqtt
   */
  async function getConfiguration(req, res) {
    const configuration = await mqttManager.getConfiguration();
    if (!configuration.useEmbeddedBroker && configuration.mqttPassword) {
      configuration.mqttPassword = DEFAULT.HIDDEN_PASSWORD; // Hide password from external broker
    }
    res.json(configuration);
  }

  return {
    'post /api/v1/service/mqtt/connect': {
      authenticated: true,
      controller: asyncMiddleware(connect),
    },
    'get /api/v1/service/mqtt/status': {
      authenticated: true,
      controller: status,
    },
    'get /api/v1/service/mqtt/config': {
      authenticated: true,
      controller: asyncMiddleware(getConfiguration),
    },
  };
};
