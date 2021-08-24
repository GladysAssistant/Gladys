const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const logger = require('../../../utils/logger');

module.exports = function Zwave2mqttController(zwave2mqttManager) {
  /**
   * @api {get} /api/v1/service/zwave2mqtt/status Get Zwave2mqtt status.
   * @apiName status
   * @apiGroup Zwave2mqtt
   */
  async function status(req, res) {
    res.json(zwave2mqttManager.status());
  }

  /**
   * @api {get} /api/v1/service/zwave2mqtt/connect Connect to Zwave2mqtt service.
   * @apiName connect
   * @apiGroup Zwave2mqtt
   */
  async function connect(req, res) {
    res.json(zwave2mqttManager.status());
  }

  /**
   * @api {get} /api/v1/service/zwave2mqtt/config Get Zwave2mqtt configuration.
   * @apiName getConfiguration
   * @apiGroup Zwave2mqtt
   */
  async function getConfiguration(req, res) {
    const configuration = await zwave2mqttManager.getConfiguration();
    if (!configuration.useEmbeddedBroker && configuration.mqttPassword) {
      configuration.mqttPassword = '*********'; // Hide password from external broker
    }
    res.json(configuration);
  }

  /**
   * @api {post} /api/v1/service/zwave2mqtt/config Update Zwave2mqtt configuration.
   * @apiName  updateConfiguration
   * @apiGroup Zwave2mqtt
   */
  async function updateConfiguration(req, res) {
    const configuration = await zwave2mqttManager.updateConfiguration(req.body);
    res.json(configuration);
  }

  /**
   * @api {get} /api/v1/service/zwave2mqtt/device Get discovered Zwave2mqtt devices.
   * @apiName device
   * @apiGroup Zwave2mqtt
   */
  async function device(req, res) {
    const response = await zwave2mqttManager.getDiscoveredDevices();
    res.json(response);
  }

  /**
   * @api {post} /api/v1/service/zwave2mqtt/discover Discover Zwave2mqtt devices.
   * @apiName discover
   * @apiGroup Zwave2mqtt
   */
  async function discover(req, res) {
    await zwave2mqttManager.startDiscoveringDevices(req.body);
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/zwave2mqtt/mqtt/start Install & start MQTT container.
   * @apiName installMqttContainer
   * @apiGroup Zwave2mqtt
   */
  async function installMqttContainer(req, res) {
    logger.log('Install MQTT container');
    await zwave2mqttManager.installMqttContainer();
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/zwave2mqtt/z2m/start Install & start Z2M container.
   * @apiName installZ2mContainer
   * @apiGroup Zwave2mqtt
   */
  async function installZ2mContainer(req, res) {
    logger.log('Install Z2M container');
    await zwave2mqttManager.installZ2mContainer();
    res.json({
      success: true,
    });
  }

  return {
    'get /api/v1/service/zwave2mqtt/status': {
      authenticated: true,
      controller: asyncMiddleware(status),
    },
    'get /api/v1/service/zwave2mqtt/connect': {
      authenticated: true,
      controller: asyncMiddleware(connect),
    },
    'get /api/v1/service/zwave2mqtt/device': {
      authenticated: true,
      controller: asyncMiddleware(device),
    },
    'post /api/v1/service/zwave2mqtt/discover': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(discover),
    },
    'get /api/v1/service/zwave2mqtt/config': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(getConfiguration),
    },
    'post /api/v1/service/zwave2mqtt/config': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(updateConfiguration),
    },
    'post /api/v1/service/zwave2mqtt/mqtt/start': {
      authenticated: true,
      controller: asyncMiddleware(installMqttContainer),
    },
    'post /api/v1/service/zwave2mqtt/z2m/start': {
      authenticated: true,
      controller: asyncMiddleware(installZ2mContainer),
    },
  };
};
