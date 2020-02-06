const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');

module.exports = function RFlinkController(gladys, RFlinkManager, serviceID) {
    /**
     * @api {get} /api/v1/service/rflink/devices get rflink devices
     * @apiName getDevices
     * @apiGroup RFlink
     */
    async function getDevices(req, res) {
        logger.log('getting devices ...');
        res.json(RFlinkManager.getDevices());
    }

    /**
     * @api {get} /api/v1/service/rflink/connect connect to the gateway
     * @apiName connect
     * @apiGroup RFlink
     */
    async function connect(req, res) {
        const rflinkPath = await gladys.variable.getValue('RFLINK_PATH');
        if (!rflinkPath) {
            throw new ServiceNotConfiguredError('RFLINK_PATH_NOT_FOUND');
          }
        RFlinkManager.connect(rflinkPath);
        res.json({succes: true, });
    }
    /**
     * @api {get} /api/v1/service/rflink/disconnect discconnect the gateway
     * @apiName disconnect
     * @apiGroup RFlink
     */
    async function disconnect(req, res) {
        RFlinkManager.disconnect();
        res.json({
            success: true,
          });
    }
    /**
     * @api {get} /api/v1/service/rflink/status get the gateway's status
     * @apiName getStatus
     * @apiGroup RFlink
     */
    async function getStatus(req, res) {
    logger.log('getting status');
    res.json({
      connected: RFlinkManager.connected,
      scanInProgress: RFlinkManager.scanInProgress,
    });
  }

    return {
        'get /api/v1/service/rflink/devices' : {
            authenticated: true,
            controller: asyncMiddleware(getDevices)
        },
        'post /api/v1/service/rflink/connect' : {
            authenticated: true,
            controller: asyncMiddleware(connect)
        },
        'post /api/v1/service/rflink/disconnect' : {
            authenticated: true,
            controller: asyncMiddleware(disconnect)
        },
        'get /api/v1/sevice/rflink/status' : {
            authenticated: true,
            controller: asyncMiddleware(getStatus)
        }

    };
};