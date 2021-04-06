const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const logger = require('../../../utils/logger');

module.exports = function Zigbee2mqttController(gladys, zigbee2mqttManager) {
  /**
   * @api {post} /api/v1/service/zigbee2mqtt/discover Launch Zigbee2mqtt devices discovery
   * @apiName discover
   * @apiGroup Zigbee2mqtt
   */
  async function discover(req, res) {
    logger.log('Launching devices discovery');
    await zigbee2mqttManager.discoverDevices();
    res.json({ status: 'discovering' });
  }

  /**
   * @api {get} /api/v1/service/zigbee2mqtt/status Get Zigbee2mqtt connection status
   * @apiName status
   * @apiGroup Zigbee2mqtt
   */
  async function status(req, res) {
    logger.log('Get status');
    const response = await zigbee2mqttManager.status();
    res.json(response);
  }

  /**
   * @api {post} /api/v1/service/zigbee2mqtt/connect Connect
   * @apiName connect
   * @apiGroup Zigbee2mqtt
   */
  async function connect(req, res) {
    logger.log('Entering connect step');
    await zigbee2mqttManager.init();
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/zigbee2mqtt/mqtt/start Install & start MQTT container.
   * @apiName installMqttContainer
   * @apiGroup Zigbee2mqtt
   */
  async function installMqttContainer(req, res) {
    logger.log('Install MQTT container');
    await zigbee2mqttManager.installMqttContainer();
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/zigbee2mqtt/z2m/start Install & start Z2M container.
   * @apiName installZ2mContainer
   * @apiGroup Zigbee2mqtt
   */
  async function installZ2mContainer(req, res) {
    logger.log('Install Z2M container');
    await zigbee2mqttManager.installZ2mContainer();
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/zigbee2mqtt/disconnect Disconnect
   * @apiName disconnect
   * @apiGroup Zigbee2mqtt
   */
  async function disconnect(req, res) {
    logger.log('Entering disconnect step');
    await zigbee2mqttManager.disconnect();
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/zigbee2mqtt/permit_join Toggle permit_join Zigbee devices
   * @apiName togglePermitJoin
   * @apiGroup Zigbee2mqtt
   */
  async function togglePermitJoin(req, res) {
    logger.log('Toggle permit_join');
    await zigbee2mqttManager.setPermitJoin();
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/service/zigbee2mqtt/permit_join Get permit_join status
   * @apiName getPermitJoin
   * @apiGroup Zigbee2mqtt
   */
  async function getPermitJoin(req, res) {
    logger.log('Get permit_join');
    const response = zigbee2mqttManager.getPermitJoin();
    res.json(response);
  }

  return {
    'post /api/v1/service/zigbee2mqtt/discover': {
      authenticated: true,
      controller: asyncMiddleware(discover),
    },
    'get /api/v1/service/zigbee2mqtt/status': {
      authenticated: true,
      controller: asyncMiddleware(status),
    },
    'post /api/v1/service/zigbee2mqtt/connect': {
      authenticated: true,
      controller: asyncMiddleware(connect),
    },
    'post /api/v1/service/zigbee2mqtt/mqtt/start': {
      authenticated: true,
      controller: asyncMiddleware(installMqttContainer),
    },
    'post /api/v1/service/zigbee2mqtt/z2m/start': {
      authenticated: true,
      controller: asyncMiddleware(installZ2mContainer),
    },
    'post /api/v1/service/zigbee2mqtt/disconnect': {
      authenticated: true,
      controller: asyncMiddleware(disconnect),
    },
    'post /api/v1/service/zigbee2mqtt/permit_join': {
      authenticated: true,
      controller: asyncMiddleware(togglePermitJoin),
    },
    'get /api/v1/service/zigbee2mqtt/permit_join': {
      authenticated: true,
      controller: asyncMiddleware(getPermitJoin),
    },
  };
};
