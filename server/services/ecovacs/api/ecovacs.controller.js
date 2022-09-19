const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const logger = require('../../../utils/logger');

module.exports = function EcovacsController(ecovacsHandler) {
  /**
   * @api {get} /api/v1/service/ecovacs/status Get Ecovacs service status
   * @apiName getStatus
   * @apiGroup Ecovacs
   */
  async function getStatus(req, res) {
    const status = ecovacsHandler.getStatus();
    res.json(status);
  }

  /**
   * @api {get} /api/v1/service/ecovacs/:device_selector/status Get Vacbot status
   * @apiName getDeviceStatus
   * @apiGroup Ecovacs
   */
  async function getDeviceStatus(req, res) {
    const device = ecovacsHandler.gladys.device.getBySelector(req.params.device_selector);
    const deviceExternalId = device.external_id;
    logger.debug(`${deviceExternalId} from ${JSON.stringify(req.params)}`);
    if (deviceExternalId) {
      logger.debug(`Searching ${deviceExternalId} `);
      const status = await ecovacsHandler.getDeviceStatus(deviceExternalId);
      logger.debug(`${JSON.stringify(status)}`);
      res.json(status);
    } else {
      logger.debug(`${deviceExternalId} not found`);
      res.json({});
    }
  }

  /**
   * @api {get} /api/v1/service/ecovacs/config Get Ecovacs configuration
   * @apiName getConfiguration
   * @apiGroup Ecovacs
   */
  async function getConfiguration(req, res) {
    const config = ecovacsHandler.getConfiguration();
    res.json(config);
  }

  /**
   * @api {post} /api/v1/service/ecovacs/config Save Ecovacs configuration
   * @apiName saveConfiguration
   * @apiGroup Ecovacs
   */
  async function saveConfiguration(req, res) {
    ecovacsHandler.saveConfiguration(req.body);
    res.json({ success: true });
  }

  /**
   * @api {get} /api/v1/service/ecovacs/connect Connect to Ecovacs cloud.
   * @apiName connect
   * @apiGroup Ecovacs
   */
  async function connect(req, res) {
    await ecovacsHandler.connect();
    res.json({ success: true });
  }

  /**
   * @api {get} /api/v1/service/ecovacs/discover Retrieve Ecovacs devices from cloud.
   * @apiName discover
   * @apiGroup Ecovacs
   */
  async function discover(req, res) {
    const devices = await ecovacsHandler.discover();
    res.json(devices);
  }

  return {
    'get /api/v1/service/ecovacs/status': {
      authenticated: true,
      controller: asyncMiddleware(getStatus),
    },
    'get /api/v1/service/ecovacs/:device_selector/status': {
      authenticated: true,
      controller: asyncMiddleware(getDeviceStatus),
    },
    'get /api/v1/service/ecovacs/config': {
      authenticated: true,
      controller: getConfiguration,
    },
    'post /api/v1/service/ecovacs/config': {
      authenticated: true,
      controller: saveConfiguration,
    },
    'get /api/v1/service/ecovacs/connect': {
      authenticated: true,
      controller: asyncMiddleware(connect),
    },
    'get /api/v1/service/ecovacs/discover': {
      authenticated: true,
      controller: asyncMiddleware(discover),
    },
  };
};
