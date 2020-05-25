const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function ArduinoController(gladys, arduinoManager, serviceId) {
  /**
   * @api {post} /api/v1/service/arduin/send Send
   * @apiName send
   * @apiGroup Arduino
   */
  async function send(req, res) {
    arduinoManager.send(req.body);
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/arduin/listen Listen
   * @apiName listen
   * @apiGroup Arduino
   */
  async function listen(req, res) {
    arduinoManager.listen(req.body);
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/arduin/configure Configure
   * @apiName configure
   * @apiGroup Arduino
   */
  async function configure(req, res) {
    arduinoManager.configure(req.body);
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/arduin/setup Setup
   * @apiName setup
   * @apiGroup Arduino
   */
  async function setup(req, res) {
    arduinoManager.setup(req.body);
    res.json({
      success: true,
    });
  }

  return {
    'post /api/v1/service/arduino/listen': {
      authenticated: true,
      controller: asyncMiddleware(listen),
    },
    'post /api/v1/service/arduino/send': {
      authenticated: true,
      controller: asyncMiddleware(send),
    },
    'post /api/v1/service/arduino/configure': {
      authenticated: true,
      controller: asyncMiddleware(configure),
    },
    'post /api/v1/service/arduino/setup': {
      authenticated: true,
      controller: asyncMiddleware(setup),
    },
  };
};
