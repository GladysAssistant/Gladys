const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');

module.exports = function ArduinoController(gladys, arduinoManager, serviceId) {
  /**
   * @api {post} /api/v1/service/arduino/connect Connect
   * @apiName connect
   * @apiGroup Arduino
   */
  async function connect(req, res) {
    arduinoManager.connect(arduinoManager.device);
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/arduino/disconnect Disconnect
   * @apiName disconnect
   * @apiGroup Arduino
   */
  async function disconnect(req, res) {
    arduinoManager.disconnect();
    res.json({
      success: true,
    });
  }

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
   * @api {post} /api/v1/service/arduin/recv Receive
   * @apiName recv
   * @apiGroup Arduino
   */
  async function recv(req, res) {
    arduinoManager.recv(req.body);
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
    'post /api/v1/service/arduino/connect': {
      authenticated: true,
      controller: asyncMiddleware(connect),
    },
    'post /api/v1/service/arduino/disconnect': {
      authenticated: true,
      controller: asyncMiddleware(disconnect),
    },
    'post /api/v1/service/arduino/send': {
      authenticated: true,
      controller: asyncMiddleware(send),
    },
    'post /api/v1/service/arduino/setup': {
      authenticated: true,
      controller: asyncMiddleware(setup),
    },
    'post /api/v1/service/arduino/recv': {
      authenticated: true,
      controller: asyncMiddleware(recv),
    },
  };
};
