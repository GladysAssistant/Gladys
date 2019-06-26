const asyncMiddleware = require('../middlewares/asyncMiddleware');
const { EVENTS, ACTIONS, ACTIONS_STATUS } = require('../../utils/constants');

module.exports = function LightController(gladys) {
  /**
   * @api {post} /api/v1/light/:device_selector/on Turn On
   * @apiName TurnOn
   * @apiGroup Light
   * @apiSuccessExample {json} Success-Example
   * {
   *   "type": "light.turn-on",
   *   "device": "test",
   *   "status": "pending"
   * }
   */
  async function turnOn(req, res) {
    const action = {
      type: ACTIONS.LIGHT.TURN_ON,
      device: req.params.device_selector,
      status: ACTIONS_STATUS.PENDING,
    };
    gladys.event.emit(EVENTS.ACTION.TRIGGERED, action);
    res.json(action);
  }

  return Object.freeze({
    turnOn: asyncMiddleware(turnOn),
  });
};
