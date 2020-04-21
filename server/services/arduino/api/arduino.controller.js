const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

module.exports = function ArduinoController(gladys, arduinoManager, serviceId) {

  /**
   * @api {post} /api/v1/service/arduino/connect Connect
   * @apiName connect
   * @apiGroup Arduino
   */
  async function connect(req, res) {
    const arduinoPath = await gladys.variable.getValue('ARDUINO_PATH', serviceId);
    if (!arduinoPath) {
      throw new ServiceNotConfiguredError('ARDUINO_PATH_NOT_FOUND');
    }
    arduinoManager.connect(arduinoPath);
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
   * @api {get} /api/v1/service/arduino/status Get Arduino Status
   * @apiName getStatus
   * @apiGroup Arduino
   */
  async function getStatus(req, res) {
    res.json({
      connected: arduinoManager.connected,
      scanInProgress: arduinoManager.scanInProgress,
      ready: arduinoManager.ready,
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
    'get /api/v1/service/arduino/info': {
      authenticated: true,
      controller: asyncMiddleware(getInfos),
    },
    'get /api/v1/service/arduino/status': {
      authenticated: true,
      controller: asyncMiddleware(getStatus),
    }
  };
};
