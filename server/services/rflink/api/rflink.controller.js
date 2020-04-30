/* eslint-disable prefer-destructuring */
const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');

module.exports = function RFlinkController(gladys, RFlinkManager, serviceID) {
  /**
   * @api {get} /api/v1/service/rflink/devices get rflink devices
   * @apiName getDevices
   * @apiGroup RFlink
   */
  async function getNewDevices(req, res) {
    res.json(RFlinkManager.getNewDevices());
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
    res.json({ succes: true });
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
    res.json({
      currentMilightGateway: RFlinkManager.currentMilightGateway,
      lastCommand: RFlinkManager.lastCommand,
      connected: RFlinkManager.connected,
      scanInProgress: RFlinkManager.scanInProgress,
      ready: RFlinkManager.ready,
    });
  }

  /**
   * @api {get} /api/v1/service/rflink/pair send a milight pairing command
   * @apiName pair
   * @apiGroup RFlink
   */
  async function pair(req, res) {
    let milightZone = req.body.zone;
    if (milightZone === undefined || milightZone === null) {
      milightZone = 1;
    }
    let currentMilightGateway = await gladys.variable.getValue('CURRENT_MILIGHT_GATEWAY', serviceID);
    if (currentMilightGateway === null) {
      currentMilightGateway = RFlinkManager.currentMilightGateway;
    }
    RFlinkManager.currentMilightGateway = currentMilightGateway;

    RFlinkManager.pair(currentMilightGateway, milightZone);

    res.json({
      succes: true,
      currentMilightGateway,
      milightZone,
    });
  }

  /**
   * @api {get} /api/v1/service/rflink/pair send a milight unpairing command
   * @apiName unpair
   * @apiGroup RFlink
   */
  async function unpair(req, res) {
    let milightZone = req.body.zone;
    if (milightZone === undefined || milightZone === null) {
      milightZone = 1;
    }
    let currentMilightGateway = await gladys.variable.getValue('CURRENT_MILIGHT_GATEWAY', serviceID);
    if (currentMilightGateway === null) {
      currentMilightGateway = RFlinkManager.currentMilightGateway;
    }
    RFlinkManager.currentMilightGateway = currentMilightGateway;

    RFlinkManager.unpair(currentMilightGateway, milightZone);
    res.json({
      succes: true,
      currentMilightGateway,
      milightZone,
    });
  }
  /**
   * @api {get} /api/v1/service/rflink/debug send a rflink command
   * @apiName debug
   * @apiGroup RFlink
   */
  async function sendDebug(req, res) {
    const command = req.body.value;
    RFlinkManager.sendUsb.write(command);

    res.json({
      succes: true,
    });
  }
  /**
   * @apiName remove
   * @apiGroup RFlink
   * @api {post} /api/v1/service/rflink/remove remove a device from the device list
   */
  async function remove(req, res) {
    const index = RFlinkManager.newDevices.findIndex(element => {
      console.log(element.external_id);
      if (element.external_id === req.body.external_id) {
        return true;
      } 
        return false;
    });
    if (index !== -1) {
      RFlinkManager.newDevices.splice(index, 1);
    }

    res.json({
      success: true,
    });
  }

  return {
    'post /api/v1/service/rflink/pair': {
      authenticated: true,
      controller: asyncMiddleware(pair),
    },
    'post /api/v1/service/rflink/unpair': {
      authenticated: true,
      controller: asyncMiddleware(unpair),
    },
    'get /api/v1/service/rflink/newDevices': {
      authenticated: true,
      controller: asyncMiddleware(getNewDevices),
    },
    'post /api/v1/service/rflink/connect': {
      authenticated: true,
      controller: asyncMiddleware(connect),
    },
    'post /api/v1/service/rflink/disconnect': {
      authenticated: true,
      controller: asyncMiddleware(disconnect),
    },
    'post /api/v1/service/rflink/debug': {
      authenticated: true,
      controller: asyncMiddleware(sendDebug),
    },
    'get /api/v1/service/rflink/status': {
      authenticated: true,
      controller: asyncMiddleware(getStatus),
    },
    'post /api/v1/service/rflink/remove': {
      authenticated: true,
      controller: asyncMiddleware(remove),
    },
  };
};
