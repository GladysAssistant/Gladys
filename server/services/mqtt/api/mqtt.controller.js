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

  return {
    'post /api/v1/service/mqtt/connect': {
      authenticated: true,
      controller: connect,
    },
  };
};
