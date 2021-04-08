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

  return Object.freeze({
    turnOn: asyncMiddleware(turnOn),
    turnOff: asyncMiddleware(turnOff),
  });
};
