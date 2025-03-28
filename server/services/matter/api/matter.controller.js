const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function MatterController(matterHandler) {
  /**
   * @api {post} /api/v1/service/matter/pair-device Pair a device
   * @apiName pairDevice
   * @apiGroup Matter
   */
  async function pairDevice(req, res) {
    await matterHandler.pairDevice(req.body.pairing_code);
    res.json({ success: true });
  }

  /**
   * @api {get} /api/v1/service/matter/paired-device Get paired devices
   * @apiName getPairedDevices
   * @apiGroup Matter
   */
  async function getPairedDevices(req, res) {
    const devices = matterHandler.getDevices();
    res.json(devices);
  }

  return {
    'post /api/v1/service/matter/pair-device': {
      authenticated: true,
      controller: asyncMiddleware(pairDevice),
    },
    'get /api/v1/service/matter/paired-device': {
      authenticated: true,
      controller: asyncMiddleware(getPairedDevices),
    },
  };
};
