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

  /**
   * @api {get} /api/v1/service/tasmota/discover/http Get discovered Tasmota devices over HTTP
   * @apiName discoverHttp
   * @apiGroup Tasmota
   */
  function discoverHttp(req, res) {
    res.json(tasmotaManager.getHttpDiscoveredDevices());
  }

  /**
   * @api {post} /api/v1/service/tasmota/discover/http Discover Tasmota devices over HTTP
   * @apiName scanHttp
   * @apiGroup Tasmota
   */
  function scanHttp(req, res) {
    tasmotaManager.scanHttp(req.body);
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
    'get /api/v1/service/tasmota/discover/http': {
      authenticated: true,
      controller: discoverHttp,
    },
    'post /api/v1/service/tasmota/discover/http': {
      authenticated: true,
      controller: scanHttp,
    },
  };
};
