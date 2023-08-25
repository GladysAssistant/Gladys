const fs = require('fs');
const path = require('path');

const logger = require('../../../utils/logger');
const { Error404, Error400 } = require('../../../utils/httpErrors');
const { validateFilename, validateSessionId } = require('../utils/validateStreamParams');
const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function RtspCameraController(gladys, rtspCameraHandler) {
  /**
   * @api {post} /api/v1/service/rtsp-camera/camera/test Test connection
   * @apiName TestConnection
   * @apiGroup RtspCamera
   */
  async function testConnection(req, res) {
    const cameraImage = await rtspCameraHandler.getImage(req.body);
    res.send(cameraImage);
  }

  /**
   * @api {post} /api/v1/service/rtsp-camera/camera/:camera_selector/streaming/start Start streaming
   * @apiName startStreaming
   * @apiGroup RtspCamera
   */
  async function startStreaming(req, res) {
    const response = await rtspCameraHandler.startStreamingIfNotStarted(
      req.params.camera_selector,
      req.body.is_gladys_gateway,
      req.body.segment_duration,
    );
    res.send(response);
  }

  /**
   * @api {post} /api/v1/service/rtsp-camera/camera/:camera_selector/streaming/stop Stop streaming
   * @apiName stopStreaming
   * @apiGroup RtspCamera
   */
  async function stopStreaming(req, res) {
    await rtspCameraHandler.stopStreaming(req.params.camera_selector);
    res.send({ success: true });
  }

  /**
   * @api {post} /api/v1/service/rtsp-camera/camera/:camera_selector/streaming/ping Live still active ping
   * @apiName streamingPing
   * @apiGroup RtspCamera
   */
  async function streamingPing(req, res) {
    await rtspCameraHandler.liveActivePing(req.params.camera_selector);
    res.send({ success: true });
  }

  /**
   * @api {get} /api/v1/service/rtsp-camera/camera/streaming/:folder/:file Get streaming file
   * @apiName getStreamingFile
   * @apiGroup RtspCamera
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
    'post /api/v1/service/rtsp-camera/camera/test': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(testConnection),
    },
    'post /api/v1/service/rtsp-camera/camera/:camera_selector/streaming/start': {
      authenticated: true,
      admin: false,
      controller: asyncMiddleware(startStreaming),
    },
    'post /api/v1/service/rtsp-camera/camera/:camera_selector/streaming/stop': {
      authenticated: true,
      admin: false,
      controller: asyncMiddleware(stopStreaming),
    },
    'post /api/v1/service/rtsp-camera/camera/:camera_selector/streaming/ping': {
      authenticated: true,
      admin: false,
      controller: asyncMiddleware(streamingPing),
    },
    'get /api/v1/service/rtsp-camera/camera/streaming/:folder/:file': {
      authenticated: true,
      admin: false,
      controller: asyncMiddleware(getStreamingFile),
    },
  };
};
