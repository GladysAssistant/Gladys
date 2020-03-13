module.exports = function MqttController(tasmotaManager) {
  /**
   * @api {get} /api/v1/service/tasmota/discover/mqtt Get discovered Tasmota devices over MQTT
   * @apiName discoverHttp
   * @apiGroup Tasmota
   */
  function discoverMqtt(req, res) {
    res.json(tasmotaManager.getMqttDiscoveredDevices());
  }

  /**
   * @api {post} /api/v1/service/tasmota/discover/mqtt Force to discover Tasmota devices over MQTT
   * @apiName scanMqtt
   * @apiGroup Tasmota
   */
  function scanMqtt(req, res) {
    tasmotaManager.forceScan();
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
