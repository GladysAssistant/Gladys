module.exports = function MqttController(mqttManager) {
  /**
   * @api {get} /api/v1/service/tasmota/discover/mqtt Get discovered Tasmota devices over MQTT
   * @apiName discoverMqtt
   * @apiGroup Tasmota
   */
  function discoverMqtt(req, res) {
    res.json(mqttManager.getDiscoveredDevices());
  }

  /**
   * @api {post} /api/v1/service/tasmota/discover/mqtt Force to discover Tasmota devices over MQTT
   * @apiName scanMqtt
   * @apiGroup Tasmota
   */
  function scanMqtt(req, res) {
    mqttManager.forceScan();
    res.json({
      success: true,
    });
  }

  return {
    'get /api/v1/service/tasmota/discover/mqtt': {
      authenticated: true,
      controller: discoverMqtt,
    },
    'post /api/v1/service/tasmota/discover/mqtt': {
      authenticated: true,
      controller: scanMqtt,
    },
  };
};
