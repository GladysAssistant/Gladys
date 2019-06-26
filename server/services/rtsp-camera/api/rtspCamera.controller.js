module.exports = function RtspCameraController(rtspCameraHandler) {
  /**
   * @api {post} /api/v1/service/rtsp-camera/camera/test Test connection
   * @apiName TestConnection
   * @apiGroup RtspCamera
   */
  async function testConnection(req, res) {
    const cameraImage = await rtspCameraHandler.getImage(req.body);
    res.send(cameraImage);
  }

  return {
    'post /api/v1/service/rtsp-camera/camera/test': {
      authenticated: true,
      controller: testConnection,
    },
  };
};
