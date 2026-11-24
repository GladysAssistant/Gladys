const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { BadParameters, NotFoundError, ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { Error500 } = require('../../../utils/httpErrors');

/**
 * @description Reads the node ID of a route.
 * @param {object} req - The request.
 * @returns {bigint} The node ID.
 * @example
 * const nodeId = parseNodeId(req);
 */
function parseNodeId(req) {
  if (!/^\d+$/.test(req.params.node_id)) {
    throw new BadParameters('node_id must be a number');
  }
  return BigInt(req.params.node_id);
}

/**
 * @description Tells if a boolean query parameter is set: a string through the local API, a boolean
 * through Gladys Plus (the query object is forwarded as is).
 * @param {object} req - The request.
 * @param {string} name - The name of the query parameter.
 * @returns {boolean} True when the parameter is true.
 * @example
 * isQueryFlagSet(req, 'with_clusters');
 */
function isQueryFlagSet(req, name) {
  return Boolean(req.query && (req.query[name] === 'true' || req.query[name] === true));
}

/**
 * @description Runs an action on a node, so that its error reaches the user: typed errors keep their
 * status through the error middleware, any other error is sent with its message (the error middleware
 * would send an Error object, which serializes to {}; the status is in the body, Gladys Plus ignores
 * res.status()).
 * @param {Function} action - The action.
 * @returns {Promise<any>} The result of the action.
 * @example
 * const result = await runNodeAction(() => matterHandler.identifyNode(nodeId));
 */
async function runNodeAction(action) {
  try {
    return await action();
  } catch (e) {
    if (e instanceof BadParameters || e instanceof NotFoundError || e instanceof ServiceNotConfiguredError) {
      throw e;
    }
    throw new Error500(e.message);
  }
}

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
   * @apiQuery {boolean} [with_clusters] - Also list the endpoints and clusters of each node (expert mode).
   */
  async function getNodes(req, res) {
    const nodes = await matterHandler.getNodes({
      withGladysDevices: isQueryFlagSet(req, 'with_gladys_devices'),
      withClusters: isQueryFlagSet(req, 'with_clusters'),
    });
    res.json(nodes);
  }

  /**
   * @api {get} /api/v1/service/matter/node/:node_id Get the sheet of a node
   * @apiName getNodeDetails
   * @apiGroup Matter
   */
  async function getNodeDetails(req, res) {
    const nodeId = parseNodeId(req);
    const details = await runNodeAction(() => matterHandler.getNodeDetails(nodeId));
    res.json(details);
  }

  /**
   * @api {post} /api/v1/service/matter/node/:node_id/identify Make a node identify itself
   * @apiName identifyNode
   * @apiGroup Matter
   */
  async function identifyNode(req, res) {
    const nodeId = parseNodeId(req);
    const result = await runNodeAction(() => matterHandler.identifyNode(nodeId));
    res.json({ success: true, ...result });
  }

  /**
   * @api {post} /api/v1/service/matter/node/:node_id/share Share a node with another ecosystem
   * @apiName shareNode
   * @apiGroup Matter
   */
  async function shareNode(req, res) {
    const nodeId = parseNodeId(req);
    const result = await runNodeAction(() => matterHandler.shareNode(nodeId));
    res.json({ success: true, ...result });
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
    const nodeId = parseNodeId(req);
    const gladysDeviceSelectors = (req.body && req.body.gladys_device_selectors) || [];
    if (
      !Array.isArray(gladysDeviceSelectors) ||
      gladysDeviceSelectors.some((selector) => typeof selector !== 'string')
    ) {
      throw new BadParameters('gladys_device_selectors must be an array of selectors');
    }
    const result = await runNodeAction(() => matterHandler.decommission(nodeId, { gladysDeviceSelectors }));
    res.json({ success: true, ...result });
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
    'get /api/v1/service/matter/node/:node_id': {
      authenticated: true,
      controller: asyncMiddleware(getNodeDetails),
    },
    'post /api/v1/service/matter/node/:node_id/identify': {
      authenticated: true,
      controller: asyncMiddleware(identifyNode),
    },
    'post /api/v1/service/matter/node/:node_id/share': {
      authenticated: true,
      admin: true,
      controller: asyncMiddleware(shareNode),
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
