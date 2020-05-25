const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');

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
   * @api {get} /api/v1/service/arduin/init Init
   * @apiName init
   * @apiGroup Arduino
   */
  async function init(req, res) {
    arduinoManager.init(req.body);
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
    'get /api/v1/service/arduino/init': {
      authenticated: true,
      controller: asyncMiddleware(init)
    },
    'post /api/v1/service/arduino/send': {
      authenticated: true,
      controller: asyncMiddleware(send)
    },
    'post /api/v1/service/arduino/configure': {
      authenticated: true,
      controller: asyncMiddleware(configure)
    },
    'post /api/v1/service/arduino/setup': {
      authenticated: true,
      controller: asyncMiddleware(setup)
    },
    'post /api/v1/service/arduino/recv': {
      authenticated: true,
      controller: asyncMiddleware(recv)
    }
  };
};
