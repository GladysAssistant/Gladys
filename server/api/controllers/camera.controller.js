const asyncMiddleware = require('../middlewares/asyncMiddleware');

module.exports = function HouseController(gladys) {
  /**
   * @api {get} /api/v1/camera get
   * @apiName get
   * @apiGroup Camera
   * @apiSuccessExample {json} Success-Response:
   * [
   *   {
   *     "id": "fbedb47f-4d25-4381-8923-2633b23192a0",
   *     "service_id": "a810b8db-6d04-4697-bed3-c4b72c996279",
   *     "room_id": "2398c689-8b47-43cc-ad32-e98d9be098b5",
   *     "name": "Test camera",
   *     "selector": "test-camera",
   *     "external_id": "test-camera-external",
   *     "should_poll": false,
   *     "poll_frequency": null,
   *     "created_at": "2019-02-12T07:49:07.556Z",
   *     "updated_at": "2019-02-12T07:49:07.556Z",
   *     "features": [
   *       {
   *         "name": "Test camera image",
   *         "selector": "test-camera-image"
   *       }
   *     ],
   *     "room": {
   *       "name": "Test room",
   *       "selector": "test-room"
   *     }
   *   }
   * ]
   */
  async function get(req, res) {
    const cameras = await gladys.device.camera.get();
    res.json(cameras);
  }
  /**
   * @api {post} /api/v1/camera/:camera_selector/image set Image
   * @apiName setImage
   * @apiGroup Camera
   * @apiParam {string} image Base64 image of the camera (max 50 ko)
   * @apiParamExample {json} Request-Example:
   * {
   *   "image": "image/png;base64,iVBORw0KGgoAmP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg=="
   * }
   */
  async function setImage(req, res) {
    await gladys.device.camera.setImage(req.params.camera_selector, req.body.image);
    res.status(201).json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/camera/:camera_selector/image get Image
   * @apiName getImage
   * @apiGroup Camera
   * @apiSuccessExample {json} Success-Response:
   * image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z/C/HgAGgwJ/lK3Q6wAAAABJRU5ErkJggg==
   */
  async function getImage(req, res) {
    const image = await gladys.device.camera.getImage(req.params.camera_selector);
    res.send(image);
  }

  /**
   * @api {post} /api/v1/camera/:camera_selector/webrtc/start Start a WebRTC live view
   * @apiName startWebRtc
   * @apiGroup Camera
   * @apiDescription For a camera declaring the GLADYS_CAMERA_STREAM_PROTOCOL=webrtc param. Gladys
   * relays the browser's SDP offer to the camera's service and gives its answer back; the media
   * goes from the camera's cloud to the browser. The offer must carry every ICE candidate (no
   * trickle). Ping the session every 10s, it ends 30s after the last ping.
   * @apiParam {string} sdp The SDP offer, every ICE candidate included
   * @apiParamExample {json} Request-Example:
   * {
   *   "sdp": "v=0\r\no=- 4611731400430051336 2 IN IP4 127.0.0.1\r\n..."
   * }
   * @apiSuccessExample {json} Success-Response:
   * {
   *   "session_id": "0c2d7f7e-4b5e-4d55-9f39-0b8e8d8c2a51",
   *   "sdp_answer": "v=0\r\no=- 1 2 IN IP4 0.0.0.0\r\n..."
   * }
   */
  async function startWebRtc(req, res) {
    const answer = await gladys.device.camera.startWebRtc(req.params.camera_selector, req.body.sdp);
    res.json(answer);
  }

  /**
   * @api {post} /api/v1/camera/:camera_selector/webrtc/ping Keep a WebRTC live view alive
   * @apiName pingWebRtc
   * @apiGroup Camera
   * @apiParam {string} session_id The session id the start returned
   * @apiError (404) CAMERA_WEBRTC_SESSION_NOT_FOUND The session is over (expired, camera turned off): stop
   * the video
   */
  async function pingWebRtc(req, res) {
    await gladys.device.camera.pingWebRtc(req.params.camera_selector, req.body.session_id);
    res.json({ success: true });
  }

  /**
   * @api {post} /api/v1/camera/:camera_selector/webrtc/stop Stop a WebRTC live view
   * @apiName stopWebRtc
   * @apiGroup Camera
   * @apiParam {string} session_id The session id the start returned
   */
  async function stopWebRtc(req, res) {
    await gladys.device.camera.stopWebRtc(req.params.camera_selector, req.body.session_id);
    res.json({ success: true });
  }

  return Object.freeze({
    setImage: asyncMiddleware(setImage),
    getImage: asyncMiddleware(getImage),
    get: asyncMiddleware(get),
    startWebRtc: asyncMiddleware(startWebRtc),
    pingWebRtc: asyncMiddleware(pingWebRtc),
    stopWebRtc: asyncMiddleware(stopWebRtc),
  });
};
