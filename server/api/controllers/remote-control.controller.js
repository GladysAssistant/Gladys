const asyncMiddleware = require('../middlewares/asyncMiddleware');

module.exports = function RemoteControlController(gladys) {
  /**
   * @api {get} /api/v1/remote-control/:remote_type get
   * @apiName getByType
   * @apiGroup RemoteControl
   *
   * @apiSuccessExample {json} Success-Response:
   * [
   *   {
   *     "id": "fbedb47f-4d25-4381-8923-2633b23192a0",
   *     "service_id": "a810b8db-6d04-4697-bed3-c4b72c996279",
   *     "room_id": "2398c689-8b47-43cc-ad32-e98d9be098b5",
   *     "name": "Test remote control",
   *     "selector": "test-remote-control",
   *     "external_id": "test-camera-external",
   *     "should_poll": false,
   *     "poll_frequency": null,
   *     "created_at": "2019-02-12T07:49:07.556Z",
   *     "updated_at": "2019-02-12T07:49:07.556Z",
   *     "features": [
   *       {
   *         "name": "Test remote control",
   *         "selector": "test-remote-control"
   *       }
   *     ],
   *     "room": {
   *       "name": "Test room",
   *       "selector": "test-room"
   *     }
   *   }
   * ]
   */
  async function getByType(req, res) {
    const remotes = await gladys.device.remoteControlManager.getByType(req.params.remote_type);
    res.json(remotes);
  }

  return Object.freeze({
    getByType: asyncMiddleware(getByType),
  });
};
