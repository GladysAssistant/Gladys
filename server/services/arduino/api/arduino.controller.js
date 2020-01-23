const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

module.exports = function ArduinoController(gladys, arduinoManager, serviceId) {

  /**
   * @api {post} /api/v1/service/arduino/connect Connect
   * @apiName connect
   * @apiGroup Arduino
   */
  async function connect(req, res) {
    const arduinoDriverPath = await gladys.variable.getValue('ARDUINO_DRIVER_PATH', serviceId);
    if (!arduinoDriverPath) {
      throw new ServiceNotConfiguredError('ARDUINO_DRIVER_PATH_NOT_FOUND');
    }
    arduinoManager.connect(arduinoDriverPath);
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
   * @api {get} /api/v1/service/arduino/info Get Arduino Informations
   * @apiName getInfos
   * @apiGroup Arduino
   */
  async function getInfos(req, res) {
    const infos = arduinoManager.getInfos();
    res.json(infos);
  }

  /**
   * @api {post} /api/v1/service/arduino/params/refresh Refresh Arduino params
   * @apiName refreshParams
   * @apiGroup Arduino
   */
  async function refreshArduinoParams(req, res) {
    arduinoManager.refreshArduinoParams();
    res.json({
      success: true,
    });
  }

  return {
    'get /api/v1/service/arduino/info': {
      authenticated: true,
      controller: asyncMiddleware(getInfos),
    },
    'post /api/v1/service/arduino/connect': {
      authenticated: true,
      controller: asyncMiddleware(connect),
    },
    'post /api/v1/service/arduino/disconnect': {
      authenticated: true,
      controller: asyncMiddleware(disconnect),
    },
    'post /api/v1/service/arduino/params/refresh': {
      authenticated: true,
      controller: asyncMiddleware(refreshArduinoParams),
    }
  };
};
