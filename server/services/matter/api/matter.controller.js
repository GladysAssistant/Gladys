const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { BadParameters, ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { Error500 } = require('../../../utils/httpErrors');

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
    // with the energy-tracking features of the devices carrying an index (energy-hierarchy.md, F)
    const devices = await matterHandler.getPairedDevices();
    res.json(devices);
  }

  /**
   * @api {get} /api/v1/service/matter/node Get nodes
   * @apiName getNodes
   * @apiGroup Matter
   * @apiQuery {boolean} [with_gladys_devices] - Also list the Gladys devices created from each node.
   */
  async function getNodes(req, res) {
    const nodes = await matterHandler.getNodes({
      withGladysDevices: Boolean(req.query && req.query.with_gladys_devices === 'true'),
    });
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
   * @apiBody {string[]} [gladys_device_selectors] - The Gladys devices of this node to delete too.
   */
  async function decommissionNode(req, res) {
    if (!/^\d+$/.test(req.params.node_id)) {
      throw new BadParameters('node_id must be a number');
    }
    const gladysDeviceSelectors = (req.body && req.body.gladys_device_selectors) || [];
    if (
      !Array.isArray(gladysDeviceSelectors) ||
      gladysDeviceSelectors.some((selector) => typeof selector !== 'string')
    ) {
      throw new BadParameters('gladys_device_selectors must be an array of selectors');
    }
    try {
      const result = await matterHandler.decommission(BigInt(req.params.node_id), { gladysDeviceSelectors });
      res.json({ success: true, ...result });
    } catch (e) {
      // typed errors keep their status (400) through the error middleware
      if (e instanceof BadParameters || e instanceof ServiceNotConfiguredError) {
        throw e;
      }
      // the cause is shown to the user: the error middleware would send an Error object, which
      // serializes to {}. The status is in the body, Gladys Plus ignores res.status()
      throw new Error500(e.message);
    }
  }

  /**
   * @api {post} /api/v1/service/matter/reset Reset Matter integration
   * @apiName reset
   * @apiGroup Matter
   */
  async function reset(req, res) {
    await matterHandler.reset();
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
      admin: true,
      controller: asyncMiddleware(decommissionNode),
    },
    'post /api/v1/service/matter/reset': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(reset),
    },
  };
};
