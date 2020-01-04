module.exports = function MqttController(mqttManager) {
  /**
   * @api {get} /api/v1/service/tasmota/discover Get discovered Tasmota devices
   * @apiName discover
   * @apiGroup Tasmota
   */
  function discover(req, res) {
    res.json(mqttManager.getDiscoveredDevices());
  }

  return {
    'get /api/v1/service/tasmota/discover': {
      authenticated: true,
      controller: discover,
    },
  };
};
