const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function MqttController(mqttManager) {
  /**
   * @api {post} /api/v1/service/mqtt/save Save MQTT connection
   * @apiName save
   * @apiGroup Mqtt
   */
  async function connect(req, res) {
    const { mqttURL, mqttUsername, mqttPassword } = req.body;
    await mqttManager.connect(mqttURL, mqttUsername, mqttPassword);
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

  return {
    'post /api/v1/service/mqtt/connect': {
      authenticated: true,
      controller: asyncMiddleware(connect),
    },
    'get /api/v1/service/mqtt/status': {
      authenticated: true,
      controller: status,
    },
  };
};
