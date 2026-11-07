const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const logger = require('../../../utils/logger');
const { ConflictError } = require('../../../utils/coreErrors');
const { INSTALLATION_STATE } = require('../lib/constants');

module.exports = function Zigbee2mqttController(gladys, zigbee2mqttManager) {
  /**
   * @description Refuse a request that the running installation would undo or run into: once its downloads are over,
   * the installation recreates the containers and saves its configuration, and a second init would run alongside it.
   * Checked here rather than in disconnect, which stop and reset call too.
   * @param {string} action - What the request does, told in the error.
   * @example
   * refuseWhileInstalling('reset');
   */
  function refuseWhileInstalling(action) {
    if (zigbee2mqttManager.installation.state === INSTALLATION_STATE.RUNNING) {
      throw new ConflictError(`Zigbee2mqtt: cannot ${action} while an installation is running`);
    }
  }

  /**
   * @api {get} /api/v1/service/zigbee2mqtt/discovered Get discovered Zigbee2mqtt devices
   * @apiName getDiscoveredDevices
   * @apiGroup Zigbee2mqtt
   */
  async function getDiscoveredDevices(req, res) {
    logger.debug('Get discovered devices');
    const { query = {} } = req;
    const defaultElectricMeterDeviceFeatureId = await gladys.energyPrice.getDefaultElectricMeterFeatureId();
    const devices = zigbee2mqttManager.getDiscoveredDevices(query, defaultElectricMeterDeviceFeatureId);
    res.json(devices);
  }

  /**
   * @api {get} /api/v1/service/zigbee2mqtt/adapter Get Zigbee2mqtt managed adapters
   * @apiName getManagerAdapters
   * @apiGroup Zigbee2mqtt
   */
  async function getManagedAdapters(req, res) {
    logger.debug('Get managed adapters');
    const response = zigbee2mqttManager.getManagedAdapters();
    res.json(response);
  }

  /**
   * @api {get} /api/v1/service/zigbee2mqtt/usb/port List serial ports, with the recognized coordinator model
   * @apiName getUsbPorts
   * @apiGroup Zigbee2mqtt
   */
  async function getUsbPorts(req, res) {
    logger.debug('Get USB ports');
    const response = await zigbee2mqttManager.getUsbPorts();
    res.json(response);
  }

  /**
   * @api {get} /api/v1/service/zigbee2mqtt/status Get Zigbee2mqtt connection status
   * @apiName status
   * @apiGroup Zigbee2mqtt
   */
  async function status(req, res) {
    logger.debug('Get status');
    const response = await zigbee2mqttManager.status();
    res.json(response);
  }

  /**
   * @api {get} /api/v1/service/zigbee2mqtt/setup Get current configuration
   * @apiName setup
   * @apiGroup Zigbee2mqtt
   */
  async function getCurrentSetup(req, res) {
    logger.debug('Getting current setup');
    const configuration = await zigbee2mqttManager.getSetup();
    res.json(configuration);
  }

  /**
   * @api {post} /api/v1/service/zigbee2mqtt/setup Setup
   * @apiName setup
   * @apiGroup Zigbee2mqtt
   */
  async function setup(req, res) {
    logger.debug('Entering setup step');
    await zigbee2mqttManager.setup(req.body);
    const configuration = await zigbee2mqttManager.getSetup();
    res.json(configuration);
  }

  /**
   * @api {post} /api/v1/service/zigbee2mqtt/prefetch Download the missing images ahead of the installation
   * @apiName prefetch
   * @apiGroup Zigbee2mqtt
   */
  async function prefetch(req, res) {
    logger.debug('Prefetch the images');
    // Answers once the disk space is checked: the downloads go on in the background
    const response = await zigbee2mqttManager.startPrefetch();
    res.json(response);
  }

  /**
   * @api {post} /api/v1/service/zigbee2mqtt/connect Connect
   * @apiName connect
   * @apiGroup Zigbee2mqtt
   */
  async function connect(req, res) {
    logger.debug('Entering connect step');
    refuseWhileInstalling('connect');
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
    logger.debug('Install MQTT container');
    // The broker accounts, also used to wait for the broker to answer
    const configuration = await zigbee2mqttManager.getConfiguration();
    await zigbee2mqttManager.installMqttContainer(configuration);
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
    logger.debug('Install Z2M container');
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
    logger.debug('Entering disconnect step');
    refuseWhileInstalling('disconnect');
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
    logger.debug('Toggle permit_join');
    await zigbee2mqttManager.setPermitJoin();
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/zigbee2mqtt/reset Reset Zigbee2mqtt integration
   * @apiName reset
   * @apiGroup Zigbee2mqtt
   */
  async function reset(req, res) {
    logger.debug('Entering reset step');
    refuseWhileInstalling('reset');
    await zigbee2mqttManager.reset();
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
    logger.debug('Get permit_join');
    const response = zigbee2mqttManager.getPermitJoin();
    res.json(response);
  }

  return {
    'get /api/v1/service/zigbee2mqtt/discovered': {
      authenticated: true,
      controller: asyncMiddleware(getDiscoveredDevices),
    },
    'get /api/v1/service/zigbee2mqtt/adapter': {
      authenticated: true,
      controller: asyncMiddleware(getManagedAdapters),
    },
    'get /api/v1/service/zigbee2mqtt/usb/port': {
      authenticated: true,
      controller: asyncMiddleware(getUsbPorts),
    },
    'get /api/v1/service/zigbee2mqtt/status': {
      authenticated: true,
      controller: asyncMiddleware(status),
    },
    // the setup holds the MQTT broker credentials Zigbee2mqtt connects with
    // (GLADYS_MQTT_PASSWORD among them) and hands them straight to res.json()
    'get /api/v1/service/zigbee2mqtt/setup': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(getCurrentSetup),
    },
    'post /api/v1/service/zigbee2mqtt/setup': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(setup),
    },
    // downloads the images of the installation, more than 200 MB on the disk of Gladys
    'post /api/v1/service/zigbee2mqtt/prefetch': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(prefetch),
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
    'post /api/v1/service/zigbee2mqtt/reset': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(reset),
    },
  };
};
