const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

module.exports = function Zigbee2mqttController(gladys, zigbee2mqttManager, serviceId) {
  /**
   * @api {post} /api/v1/service/zigbee2mqtt/discover Get discovered Zigbee2mqtt devices
   * @apiName discover
   * @apiGroup Zigbee2mqtt
   */
  function discover(req, res) {
    zigbee2mqttManager.discoverDevices();
    res.json({ status: 'discovering' });
  }

  /**
   * @api {get} /api/v1/service/zigbee2mqtt/status Get Zigbee2mqtt connection status.
   * @apiName status
   * @apiGroup Zigbee2mqtt
   */
  async function status(req, res) {
    const response = await zigbee2mqttManager.status();
    res.json(response);
  }
  
  /**
   * @api {post} /api/v1/service/zigbee2mqtt/connect Connect
   * @apiName connect
   * @apiGroup Zigbee2mqtt
   */
  async function connect(req, res) {
    const zigbee2mqttDriverPath = await gladys.variable.getValue('ZIGBEE2MQTT_DRIVER_PATH', serviceId);
    zigbee2mqttManager.connect(zigbee2mqttDriverPath);
    res.json({
      success: true,
    });
  }


  return {
    'post /api/v1/service/zigbee2mqtt/discover': {
      authenticated: true,
      controller: discover,
    },
    'get /api/v1/service/zigbee2mqtt/status': {
      authenticated: true,
      controller: status,
    },
    'post /api/v1/service/zigbee2mqtt/connect': {
      authenticated: true,
      controller: connect,
    },
  };
};
