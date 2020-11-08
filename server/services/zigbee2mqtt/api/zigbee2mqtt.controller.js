const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { CONFIGURATION } = require('../lib/constants');

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
    await zigbee2mqttManager.installMqttContainer();

    const mqttUrl = await gladys.variable.getValue(CONFIGURATION.MQTT_URL_KEY, serviceId);
    const mqttUsername = await gladys.variable.getValue(CONFIGURATION.GLADYS_MQTT_USERNAME_KEY, serviceId);
    const mqttPassword = await gladys.variable.getValue(CONFIGURATION.GLADYS_MQTT_PASSWORD_KEY, serviceId);

    await zigbee2mqttManager.connect({mqttUrl, mqttUsername, mqttPassword});
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

    await zigbee2mqttManager.disconnect();
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/zigbee2mqtt/permit_join Permit joining Zigbee devices
   * @apiName permit_join
   * @apiGroup Zigbee2mqtt
   */
  async function setPermitJoin(req, res) {

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
    const response = zigbee2mqttManager.getPermitJoin();
    res.json(response);
  }

  /**
   * @api {get} /api/v1/service/zigbee2mqtt/host_ip Get Host IP
   * @apiName getHostIP
   * @apiGroup Zigbee2mqtt
   */
  async function getHostIP(req, res) {
    const response = await zigbee2mqttManager.getHostIP();
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
      controller: setPermitJoin,
    },
    'get /api/v1/service/zigbee2mqtt/permit_join': {
      authenticated: true,
      controller: getPermitJoin,
    },
    'get /api/v1/service/zigbee2mqtt/host_ip': {
      authenticated: true,
      controller: getHostIP,
    },
  };
};
