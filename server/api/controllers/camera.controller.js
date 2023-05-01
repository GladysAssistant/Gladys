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

  return Object.freeze({
    setImage: asyncMiddleware(setImage),
    getImage: asyncMiddleware(getImage),
    get: asyncMiddleware(get),
  });
};
