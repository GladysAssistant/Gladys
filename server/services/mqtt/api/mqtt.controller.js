const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { DEFAULT } = require('../lib/constants');

module.exports = function MqttController(mqttManager) {
  /**
   * @api {post} /api/v1/service/mqtt/save Save MQTT connection
   * @apiName save
   * @apiGroup Mqtt
   */
  async function connect(req, res) {
    await mqttManager.saveConfiguration(req.body);
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/mqtt/debug_mode Get MQTT connection status.
   * @apiName status
   * @apiGroup Mqtt
   */
  async function setDebugMode(req, res) {
    const debugMode = mqttManager.setDebugMode(req.body.debug_mode);
    res.json({ debug_mode: debugMode });
  }

  /**
   * @api {get} /api/v1/service/mqtt/status Get MQTT connection status.
   * @apiName status
   * @apiGroup Mqtt
   */
  async function status(req, res) {
    const response = mqttManager.status();
    res.json(response);
  }

  /**
   * @api {get} /api/v1/service/mqtt/config Get MQTT configuration.
   * @apiName getConfiguration
   * @apiGroup Mqtt
   */
  async function getConfiguration(req, res) {
    const configuration = await mqttManager.getConfiguration();
    res.json(configuration);
  }

  /**
   * @api {post} /api/v1/service/mqtt/config/docker Install MQTT broker container.
   * @apiName getConfiguration
   * @apiGroup Mqtt
   */
  async function installContainer(req, res) {
    await mqttManager.installContainer();
    res.json({ status: DEFAULT.INSTALLATION_STATUS.DONE });
  }

  return {
    'post /api/v1/service/mqtt/connect': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(connect),
    },
    'get /api/v1/service/mqtt/status': {
      authenticated: true,
      controller: status,
    },
    'post /api/v1/service/mqtt/debug_mode': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(setDebugMode),
    },
    'get /api/v1/service/mqtt/config': {
      authenticated: true,
      controller: asyncMiddleware(getConfiguration),
    },
    'post /api/v1/service/mqtt/config/docker': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(installContainer),
    },
  };
};
