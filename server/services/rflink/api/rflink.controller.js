/* eslint-disable prefer-destructuring */
const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const logger = require('../../../utils/logger');

module.exports = function RFlinkController(gladys, rflinkManager, serviceId) {
  /**
   * @api {get} /api/v1/service/rflink/newDevices get rflink devices
   * @apiName newDevices
   * @apiGroup RFlink
   */
  async function getNewDevices(req, res) {
    const newDevices = rflinkManager.getNewDevices();
    res.json(newDevices);
  }

  /**
   * @api {post} /api/v1/service/rflink/connect connect to the gateway
   * @apiName connect
   * @apiGroup RFlink
   */
  async function connect(req, res) {
    const rflinkPath = await gladys.variable.getValue('RFLINK_PATH', serviceId);
    try {
      rflinkManager.connect(rflinkPath);
    } catch (e) {
      logger.error('RFLink gateway cannot connect : no usb path configured');
      res.json({ success: false });
    }
    res.json({ success: true });
  }

  /**
   * @api {post} /api/v1/service/rflink/disconnect disconnect the gateway
   * @apiName disconnect
   * @apiGroup RFlink
   */
  async function disconnect(req, res) {
    rflinkManager.disconnect();
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
      currentMilightGateway: rflinkManager.currentMilightGateway,
      lastCommand: rflinkManager.lastCommand,
      connected: rflinkManager.connected,
      scanInProgress: rflinkManager.scanInProgress,
      ready: rflinkManager.ready,
    });
  }

  /**
   * @api {post} /api/v1/service/rflink/pair send a milight pairing command
   * @apiName pair
   * @apiGroup RFlink
   */
  async function pair(req, res) {
    let milightZone = req.body.zone;
    if (milightZone === undefined || milightZone === null) {
      milightZone = 1;
    }
    let currentMilightGateway = await gladys.variable.getValue('CURRENT_MILIGHT_GATEWAY', serviceId);
    if (currentMilightGateway === null) {
      currentMilightGateway = rflinkManager.currentMilightGateway;
    }
    rflinkManager.currentMilightGateway = currentMilightGateway;
    rflinkManager.pair(currentMilightGateway, milightZone);

    res.json({
      success: true,
      currentMilightGateway,
      milightZone,
    });
  }

  /**
   * @api {post} /api/v1/service/rflink/pair send a milight unpairing command
   * @apiName unpair
   * @apiGroup RFlink
   */
  async function unpair(req, res) {
    let milightZone = req.body.zone;
    if (milightZone === undefined || milightZone === null) {
      milightZone = 1;
    }
    let currentMilightGateway = await gladys.variable.getValue('CURRENT_MILIGHT_GATEWAY', serviceId);
    if (currentMilightGateway === null) {
      currentMilightGateway = rflinkManager.currentMilightGateway;
    }
    rflinkManager.currentMilightGateway = currentMilightGateway;

    rflinkManager.unpair(currentMilightGateway, milightZone);
    res.json({
      success: true,
      currentMilightGateway,
      milightZone,
    });
  }

  /**
   * @api {post} /api/v1/service/rflink/debug send a rflink command
   * @apiName debug
   * @apiGroup RFlink
   */
  async function sendDebug(req, res) {
    const command = `${req.body.value}\n`;
    logger.debug(`Command send to port : ${command}`);
    rflinkManager.sendUsb.write(command);
    res.json({
      success: true,
    });
  }

  /**
   * @api {post} /api/v1/service/rflink/remove remove a device from the device list
   * @apiName remove
   * @apiGroup RFlink
   */
  async function remove(req, res) {
    // Deleting the device from the new device list
    const index = rflinkManager.newDevices.findIndex((element) => element.external_id === req.body.external_id);
    if (index !== -1) {
      rflinkManager.newDevices.splice(index, 1);
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
