const axios = require('axios').default;
const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');

module.exports = function DomoticzController(gladys, domoticzManager, serviceId) {
  /**
   * @api {post} /api/v1/service/domoticz/connect Connect to Domoticz server
   * @apiName connect
   * @apiGroup Domoticz
   */
  async function connect(req, res) {
    const [serverAddress, serverPort] = await Promise.all([
      gladys.variable.getValue('DOMOTICZ_SERVER_ADDRESS', serviceId),
      gladys.variable.getValue('DOMOTICZ_SERVER_PORT', serviceId),
    ]);
    if (!serverAddress) {
      throw new ServiceNotConfiguredError('DOMOTICZ_SERVER_ADDRESS');
    }
    if (!serverPort) {
      throw new ServiceNotConfiguredError('DOMOTICZ_SERVER_PORT');
    }
    const client = axios.create({
      baseURL: `${serverAddress}:${serverPort}/`,
      timeout: 2000,
    });
    await domoticzManager.connect(client);
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/domoticz/disconnect Disconnect
   * @apiName disconnect
   * @apiGroup Domoticz
   */
  async function disconnect(req, res) {
    await domoticzManager.disconnect();
    res.json({
      success: true,
    });
  }

  /**
   * @api {get} /api/v1/service/domoticz/devices Get Devices
   * @apiName getDevices
   * @apiGroup Domoticz
   */
  async function getDevices(req, res) {
    const devices = await domoticzManager.getDevices(req.query.order_dir, req.query.search || '');
    res.json(devices);
  }

  return {
    'post /api/v1/service/domoticz/connect': {
      authenticated: true,
      controller: asyncMiddleware(connect),
    },
    'post /api/v1/service/domoticz/disconnect': {
      authenticated: true,
      controller: asyncMiddleware(disconnect),
    },
    'get /api/v1/service/domoticz/devices': {
      authenticated: true,
      controller: asyncMiddleware(getDevices),
    },
  };
};
