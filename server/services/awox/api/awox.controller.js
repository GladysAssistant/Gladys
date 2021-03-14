const logger = require('../../../utils/logger');

module.exports = function AwoxController(awoxManager) {
  /**
   * @api {get} /api/v1/service/awox/peripheral Get AwoX discovered peripherals
   * @apiName getDiscoveredDevices
   * @apiGroup AwoX
   */
  async function getDiscoveredDevices(req, res) {
    const peripherals = awoxManager.getDiscoveredDevices();
    res.json(peripherals);
  }

  /**
   * @api {get} /api/v1/service/awox/peripheral/bluetooth-:uuid Get AwoX discovered peripheral by uuid
   * @apiName getDiscoveredDevice
   * @apiGroup AwoX
   */
  async function getDiscoveredDevice(req, res) {
    const { uuid } = req.params;
    const peripheral = awoxManager.getDiscoveredDevice(uuid);
    if (!peripheral) {
      res.status(404);
    }
    res.json(peripheral);
  }

  /**
   * @api {post} /api/v1/service/awox/peripheral/test Test AwoX peripheral
   * @apiName testDevice
   * @apiGroup AwoX
   */
  async function testDevice(req, res) {
    const { device, feature, value } = req.body;
    try {
      await awoxManager.setValue(device, feature, value);
      res.status(200);
    } catch (e) {
      logger.warn(`AwoX peripheral test failed`, e);
      res.status(500);
    }
    res.end();
  }

  return {
    'get /api/v1/service/awox/peripheral': {
      authenticated: true,
      controller: getDiscoveredDevices,
    },
    'post /api/v1/service/awox/peripheral/test': {
      authenticated: true,
      controller: testDevice,
    },
    'get /api/v1/service/awox/peripheral/bluetooth-:uuid': {
      authenticated: true,
      controller: getDiscoveredDevice,
    },
  };
};
