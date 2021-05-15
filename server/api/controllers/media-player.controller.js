const asyncMiddleware = require('../middlewares/asyncMiddleware');
const { EVENTS, ACTIONS, ACTIONS_STATUS } = require('../../utils/constants');

module.exports = function LightController(gladys) {
  /**
   * @api {post} /api/v1/media-player/:device_selector/on Turn On
   * @apiName TurnOn
   * @apiGroup MediaPlayer
   * @apiSuccessExample {json} Success-Example
   * {
   *   "type": "media-player.turn-on",
   *   "device": "test",
   *   "status": "pending"
   * }
   */
  async function turnOn(req, res) {
    const action = {
      type: ACTIONS.MEDIA_PLAYER.TURN_ON,
      device: req.params.device_selector,
      status: ACTIONS_STATUS.PENDING,
    };
    gladys.event.emit(EVENTS.ACTION.TRIGGERED, action);
    res.json(action);
  }

  /**
   * @api {post} /api/v1/media-player/:device_selector/off Turn Off
   * @apiName TurnOff
   * @apiGroup MediaPlayer
   * @apiSuccessExample {json} Success-Example
   * {
   *   "type": "media-player.turn-off",
   *   "device": "test",
   *   "status": "pending"
   * }
   */
  async function turnOff(req, res) {
    const action = {
      type: ACTIONS.MEDIA_PLAYER.TURN_OFF,
      device: req.params.device_selector,
      status: ACTIONS_STATUS.PENDING,
    };
    gladys.event.emit(EVENTS.ACTION.TRIGGERED, action);
    res.json(action);
  }

  /**
   * @api {get} /api/v1/media-player get
   * @apiName get
   * @apiGroup MediaPlayer
   *
   * @apiSuccessExample {json} Success-Response:
   * [
   *   {
   *     "id": "fbedb47f-4d25-4381-8923-2633b23192a0",
   *     "service_id": "a810b8db-6d04-4697-bed3-c4b72c996279",
   *     "room_id": "2398c689-8b47-43cc-ad32-e98d9be098b5",
   *     "name": "Test media player",
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
    const players = await gladys.device.mediaPlayerManager.get();
    res.json(players);
  }

  return Object.freeze({
    turnOn: asyncMiddleware(turnOn),
    turnOff: asyncMiddleware(turnOff),
    get: asyncMiddleware(get),
  });
};
