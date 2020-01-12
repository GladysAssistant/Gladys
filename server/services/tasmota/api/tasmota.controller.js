module.exports = function MqttController(mqttManager) {
  /**
   * @api {get} /api/v1/service/tasmota/discover Get discovered Tasmota devices
   * @apiName discover
   * @apiGroup Tasmota
   */
  function discover(req, res) {
    res.json(mqttManager.getDiscoveredDevices());
  }

  /**
   * @api {post} /api/v1/service/tasmota/discover Force to discover Tasmota devices
   * @apiName scan
   * @apiGroup Tasmota
   */
  function scan(req, res) {
    mqttManager.forceScan();
    res.json({
      success: true,
    });
  }

  return {
    'get /api/v1/service/tasmota/discover': {
      authenticated: true,
      controller: discover,
    },
    'post /api/v1/service/tasmota/discover': {
      authenticated: true,
      controller: scan,
    },
  };
};
