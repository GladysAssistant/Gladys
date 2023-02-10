const fs = require('fs');
const path = require('path');

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
    const response = await rtspCameraHandler.startStreaming(req.params.camera_selector, req.body.origin);
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
   * @api {get} /api/v1/service/rtsp-camera/camera/streaming/:folder/:file Get streaming file
   * @apiName getStreamingFile
   * @apiGroup RtspCamera
   */
  async function getStreamingFile(req, res) {
    const filePath = path.join(gladys.config.tempFolder, req.params.folder, req.params.file);
    const filestream = fs.createReadStream(filePath);
    filestream.pipe(res);
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
    'get /api/v1/service/rtsp-camera/camera/streaming/:folder/:file': {
      authenticated: true,
      admin: false,
      controller: asyncMiddleware(getStreamingFile),
    },
  };
};
