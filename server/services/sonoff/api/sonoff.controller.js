module.exports = function MqttController(mqttManager) {
  /**
   * @api {get} /api/v1/service/sonoff/discover Get discovered Sonoff devices
   * @apiName discover
   * @apiGroup Sonoff
   */
  function discover(req, res) {
    res.json(mqttManager.getDiscoveredDevices());
  }

  return {
    'get /api/v1/service/sonoff/discover': {
      authenticated: true,
      controller: discover,
    },
  };
};
