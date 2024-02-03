const fs = require('fs');
const path = require('path');

const logger = require('../../../utils/logger');
const { Error404, Error400 } = require('../../../utils/httpErrors');
const { validateFilename, validateSessionId } = require('../lib/utils/netatmo.validateStreamParams');
const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function NetatmoController(gladys, netatmoHandler) {
  /**
   * @api {get} /api/v1/service/netatmo/configuration Get Netatmo Configuration.
   * @apiName getConfiguration
   * @apiGroup Netatmo
   */
  async function getConfiguration(req, res) {
    const configuration = await netatmoHandler.getConfiguration();
    res.json(configuration);
  }

  /**
   * @api {get} /api/v1/service/netatmo/status Get Netatmo Status.
   * @apiName getStatus
   * @apiGroup Netatmo
   */
  async function getStatus(req, res) {
    const result = await netatmoHandler.getStatus();
    res.json(result);
  }

  /**
   * @api {post} /api/v1/service/netatmo/configuration Save Netatmo Configuration.
   * @apiName saveConfiguration
   * @apiGroup Netatmo
   */
  async function saveConfiguration(req, res) {
    const result = await netatmoHandler.saveConfiguration(req.body);
    res.json({
      success: result,
    });
  }

  /**
   * @api {post} /api/v1/service/netatmo/status save Netatmo connection status
   * @apiName saveStatus
   * @apiGroup Netatmo
   */
  async function saveStatus(req, res) {
    const result = await netatmoHandler.saveStatus(req.body);
    res.json({
      success: result,
    });
  }

  /**
   * @api {post} /api/v1/service/netatmo/connect Connect netatmo
   * @apiName connect
   * @apiGroup Netatmo
   */
  async function connect(req, res) {
    await netatmoHandler.getConfiguration();
    const result = await netatmoHandler.connect();
    res.json(result);
  }

  /**
   * @api {post} /api/v1/service/netatmo/token Retrieve access and refresh Tokens netatmo with code of return
   * @apiName retrieveTokens
   * @apiGroup Netatmo
   */
  async function retrieveTokens(req, res) {
    await netatmoHandler.getConfiguration();
    const result = await netatmoHandler.retrieveTokens(req.body);
    res.json(result);
  }

  /**
   * @api {post} /api/v1/service/netatmo/disconnect Disconnect netatmo
   * @apiName disconnect
   * @apiGroup Netatmo
   */
  async function disconnect(req, res) {
    await netatmoHandler.disconnect();
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/service/netatmo/discover Discover netatmo devices from API.
   * @apiName discover
   * @apiGroup Netatmo
   */
  async function discover(req, res) {
    let devices;
    if (!netatmoHandler.discoveredDevices || req.query.refresh === 'true') {
      devices = await netatmoHandler.discoverDevices();
    } else {
      devices = netatmoHandler.discoveredDevices.filter((device) => {
        const existInGladys = netatmoHandler.gladys.stateManager.get('deviceByExternalId', device.external_id);
        return existInGladys === null;
      });
    }
    res.json(devices);
  }

  /**
   * @api {post} /api/v1/service/netatmo/camera/test Test connection
   * @apiName TestConnection
   * @apiGroup Netatmo
   */
  async function testConnection(req, res) {
    const cameraImage = await netatmoHandler.getImage(req.body);
    res.send(cameraImage);
  }

  /**
   * @api {post} /api/v1/service/netatmo/camera/:camera_selector/streaming/start Start streaming
   * @apiName startStreaming
   * @apiGroup Netatmo
   */
  async function startStreaming(req, res) {
    const response = await netatmoHandler.startStreamingIfNotStarted(
      req.params.camera_selector,
      req.body.is_gladys_gateway,
      req.body.segment_duration,
    );
    res.send(response);
  }

  /**
   * @api {post} /api/v1/service/netatmo/camera/:camera_selector/streaming/stop Stop streaming
   * @apiName stopStreaming
   * @apiGroup Netatmo
   */
  async function stopStreaming(req, res) {
    await netatmoHandler.stopStreaming(req.params.camera_selector);
    res.send({ success: true });
  }

  /**
   * @api {post} /api/v1/service/netatmo/camera/:camera_selector/streaming/ping Live still active ping
   * @apiName streamingPing
   * @apiGroup Netatmo
   */
  async function streamingPing(req, res) {
    await netatmoHandler.liveActivePing(req.params.camera_selector);
    res.send({ success: true });
  }

  /**
   * @api {get} /api/v1/service/netatmo/camera/streaming/:folder/:file Get streaming file
   * @apiName getStreamingFile
   * @apiGroup Netatmo
   */
  async function getStreamingFile(req, res) {
    try {
      validateSessionId(req.params.folder);
      validateFilename(req.params.file);
      const filePath = path.join(gladys.config.tempFolder, req.params.folder, req.params.file);
      const filestream = fs.createReadStream(filePath);
      filestream.on('error', (err) => {
        res.status(404).end();
      });
      filestream.pipe(res);
    } catch (e) {
      if (e instanceof Error400) {
        throw e;
      }
      logger.warn(e);
      throw new Error404('FILE_NOT_FOUND');
    }
  }

  return {
    'get /api/v1/service/netatmo/configuration': {
      authenticated: true,
      controller: asyncMiddleware(getConfiguration),
    },
    'post /api/v1/service/netatmo/configuration': {
      authenticated: true,
      controller: asyncMiddleware(saveConfiguration),
    },
    'get /api/v1/service/netatmo/status': {
      authenticated: true,
      controller: asyncMiddleware(getStatus),
    },
    'post /api/v1/service/netatmo/status': {
      authenticated: true,
      controller: asyncMiddleware(saveStatus),
    },
    'post /api/v1/service/netatmo/connect': {
      authenticated: true,
      controller: asyncMiddleware(connect),
    },
    'post /api/v1/service/netatmo/token': {
      authenticated: true,
      controller: asyncMiddleware(retrieveTokens),
    },
    'post /api/v1/service/netatmo/disconnect': {
      authenticated: true,
      controller: asyncMiddleware(disconnect),
    },
    'get /api/v1/service/netatmo/discover': {
      authenticated: true,
      controller: asyncMiddleware(discover),
    },
    'post /api/v1/service/netatmo/camera/test': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(testConnection),
    },
    'post /api/v1/service/netatmo/camera/:camera_selector/streaming/start': {
      authenticated: true,
      admin: false,
      controller: asyncMiddleware(startStreaming),
    },
    'post /api/v1/service/netatmo/camera/:camera_selector/streaming/stop': {
      authenticated: true,
      admin: false,
      controller: asyncMiddleware(stopStreaming),
    },
    'post /api/v1/service/netatmo/camera/:camera_selector/streaming/ping': {
      authenticated: true,
      admin: false,
      controller: asyncMiddleware(streamingPing),
    },
    'get /api/v1/service/netatmo/camera/streaming/:folder/:file': {
      authenticated: true,
      admin: false,
      controller: asyncMiddleware(getStreamingFile),
    },
  };
};
