const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');

module.exports = function MatterController(matterHandler) {
  /**
   * @api {post} /api/v1/service/matter/pair-device Pair a device
   * @apiName pairDevice
   * @apiGroup Matter
   */
  async function pairDevice(req, res) {
    try {
      await matterHandler.pairDevice(req.body.pairing_code);
      res.json({ success: true });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }

  /**
   * @api {get} /api/v1/service/matter/paired-device Get paired devices
   * @apiName getPairedDevices
   * @apiGroup Matter
   */
  async function getPairedDevices(req, res) {
    await matterHandler.refreshDevices();
    const devices = matterHandler.getDevices();
    res.json(devices);
  }

  /**
   * @api {get} /api/v1/service/matter/node Get nodes
   * @apiName getNodes
   * @apiGroup Matter
   */
  async function getNodes(req, res) {
    const nodes = await matterHandler.getNodes();
    res.json(nodes);
  }

  /**
   * @api {get} /api/v1/service/matter/ipv6 Get ipv6 status
   * @apiName getIpv6Status
   * @apiGroup Matter
   */
  async function getIpv6Status(req, res) {
    const { hasIpv6, ipv6Interfaces } = await matterHandler.checkIpv6();
    res.json({
      has_ipv6: hasIpv6,
      ipv6_interfaces: ipv6Interfaces,
    });
  }

  /**
   * @api {post} /api/v1/service/matter/node/:node_id/decommission Decommission a node
   * @apiName decommissionNode
   * @apiGroup Matter
   */
  async function decommissionNode(req, res) {
    await matterHandler.decommission(BigInt(req.params.node_id));
    res.json({ success: true });
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
    'get /api/v1/service/matter/node': {
      authenticated: true,
      controller: asyncMiddleware(getNodes),
    },
    'get /api/v1/service/matter/ipv6': {
      authenticated: true,
      controller: asyncMiddleware(getIpv6Status),
    },
    'post /api/v1/service/matter/node/:node_id/decommission': {
      authenticated: true,
      controller: asyncMiddleware(decommissionNode),
    },
  };
};
