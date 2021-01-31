const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const logger = require('../../../utils/logger');

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
    logger.log('Entering connect step');
    await zigbee2mqttManager.init();

    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/zigbee2mqtt/mqtt/start Install & start MQTT container.
   * @apiName installMqttContainer
   * @apiGroup Mqtt
   */
  async function installMqttContainer(req, res) {
    let response;
    try {
      await zigbee2mqttManager.installMqttContainer();

      response = true;
    } catch (e) {
      logger.error('Error while connecting to MQTT:', e);
      response = false;
      this.gladys.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.ZIGBEE2MQTT.MQTT_ERROR,
        payload: e,
      });
      throw e;
    }

    res.json(response);
  }

  /**
   * @api {post} /api/v1/service/zigbee2mqtt/z2m/start Install & start Z2M container.
   * @apiName installZ2mContainer
   * @apiGroup Zigbee2mqtt
   */
  async function installZ2mContainer(req, res) {
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
   * @api {post} /api/v1/service/zigbee2mqtt/permit_join Permit joining Zigbee devices
   * @apiName togglePermitJoin
   * @apiGroup Zigbee2mqtt
   */
  async function togglePermitJoin(req, res) {
    zigbee2mqttManager.setPermitJoin();
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
    const response = await zigbee2mqttManager.getPermitJoin();
    res.json(response);
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
      controller: disconnect,
    },
    'post /api/v1/service/zigbee2mqtt/permit_join': {
      authenticated: true,
      controller: togglePermitJoin,
    },
    'get /api/v1/service/zigbee2mqtt/permit_join': {
      authenticated: true,
      controller: getPermitJoin,
    },
  };
};
