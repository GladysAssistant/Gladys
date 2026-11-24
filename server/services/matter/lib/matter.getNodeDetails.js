const Promise = require('bluebird');
const {
  GeneralDiagnostics,
  WiFiNetworkDiagnostics,
  ThreadNetworkDiagnostics,
  OperationalCredentials,
  Identify,
  AdministratorCommissioning,
  // eslint-disable-next-line import/no-unresolved
} = require('@matter/main/clusters');

const logger = require('../../../utils/logger');
const { NotFoundError, ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { MATTER_NODE_READ_TIMEOUT_MS } = require('../utils/constants');
const { getGladysDevicesOfNode } = require('../utils/getGladysDevicesOfNode');
const { getMatterAvailability, parseMatterExternalId } = require('../utils/getMatterAvailability');
const {
  KNOWN_CONTROLLER_VENDORS,
  NETWORK_TYPES,
  THREAD_ROLES,
  getBasicInformation,
  getNodeName,
  getNetworkType,
  getPowerSource,
  getSignalQuality,
  formatIpAddress,
  getBestThreadLink,
  collectEndpoints,
} = require('../utils/matterNodeInformation');

/**
 * @description Reads an attribute, without ever blocking the node sheet: a missing cluster or
 * attribute, an error or a node too slow to answer give undefined.
 * @param {object} clusterClient - The cluster client.
 * @param {string} attributeName - The attribute.
 * @param {object} [options] - Options.
 * @param {boolean} [options.remote] - Ask the node (true), or only read what matter.js keeps (false).
 * @param {boolean} [options.fabricFiltered] - Only the entries of the fabric of Gladys.
 * @returns {Promise<any>} The value, or undefined.
 * @example
 * await readAttribute(clusterClient, 'rssi', { remote: true });
 */
async function readAttribute(clusterClient, attributeName, { remote = true, fabricFiltered = true } = {}) {
  if (!clusterClient || !Object.prototype.hasOwnProperty.call(clusterClient.attributes, attributeName)) {
    return undefined;
  }
  let timeoutId;
  const timeout = new Promise((resolve) => {
    timeoutId = setTimeout(() => resolve(undefined), MATTER_NODE_READ_TIMEOUT_MS);
  });
  // the read handles its own failure: one coming after the timeout won the race is caught too
  const read = (async () => {
    try {
      return await clusterClient.attributes[attributeName].get(remote, fabricFiltered);
    } catch (e) {
      logger.debug(`Matter: Unable to read ${clusterClient.name}.${attributeName}: ${e}`);
      return undefined;
    }
  })();
  const value = await Promise.race([read, timeout]);
  clearTimeout(timeoutId);
  return value;
}

/**
 * @description Reads the network of a node: its type, its addresses and the strength of its signal.
 * @param {object} node - The Matter node.
 * @param {object} rootEndpoint - The root endpoint of the node.
 * @param {boolean} remote - Whether the node can be asked.
 * @returns {Promise<object>} The network.
 * @example
 * await readNetwork(node, rootEndpoint, true);
 */
async function readNetwork(node, rootEndpoint, remote) {
  const getClusterClient = (cluster) => rootEndpoint && rootEndpoint.getClusterClientById(cluster.Complete.id);
  const networkInterfaces =
    (await readAttribute(getClusterClient(GeneralDiagnostics), 'networkInterfaces', { remote })) || [];
  const type = getNetworkType(node, networkInterfaces);
  const network = {
    type,
    power_source: getPowerSource(node),
    rssi: null,
    signal_quality: null,
    thread_role: null,
    thread_channel: null,
    ip_addresses: networkInterfaces
      .filter((networkInterface) => networkInterface.isOperational)
      .reduce(
        (addresses, networkInterface) => [
          ...addresses,
          ...(networkInterface.iPv4Addresses || []),
          ...(networkInterface.iPv6Addresses || []),
        ],
        [],
      )
      .map(formatIpAddress)
      .filter(Boolean),
  };
  if (type === NETWORK_TYPES.WIFI) {
    const rssi = await readAttribute(getClusterClient(WiFiNetworkDiagnostics), 'rssi', { remote });
    network.rssi = typeof rssi === 'number' ? rssi : null;
  }
  if (type === NETWORK_TYPES.THREAD) {
    const threadClusterClient = getClusterClient(ThreadNetworkDiagnostics);
    const routingRole = await readAttribute(threadClusterClient, 'routingRole', { remote });
    const channel = await readAttribute(threadClusterClient, 'channel', { remote });
    const link = getBestThreadLink(await readAttribute(threadClusterClient, 'neighborTable', { remote }));
    network.thread_role = THREAD_ROLES[routingRole] || null;
    network.thread_channel = typeof channel === 'number' ? channel : null;
    network.rssi = link ? link.rssi : null;
  }
  network.signal_quality = getSignalQuality(network.rssi);
  return network;
}

/**
 * @description Reads the controllers (fabrics) which have access to a node. Only possible while the
 * node is connected: the fabrics are always read from the node.
 * @param {object} rootEndpoint - The root endpoint of the node.
 * @param {boolean} remote - Whether the node can be asked.
 * @returns {Promise<Array|null>} The controllers, or null when unknown.
 * @example
 * await readControllers(rootEndpoint, true);
 */
async function readControllers(rootEndpoint, remote) {
  const clusterClient = rootEndpoint && rootEndpoint.getClusterClientById(OperationalCredentials.Complete.id);
  if (!remote || !clusterClient) {
    return null;
  }
  const fabrics = await readAttribute(clusterClient, 'fabrics', { remote: true, fabricFiltered: false });
  if (!Array.isArray(fabrics)) {
    return null;
  }
  const currentFabricIndex = await readAttribute(clusterClient, 'currentFabricIndex', { remote: true });
  return fabrics.map((fabric) => ({
    fabric_index: Number(fabric.fabricIndex),
    label: typeof fabric.label === 'string' && fabric.label.trim() !== '' ? fabric.label.trim() : null,
    vendor_id: Number(fabric.vendorId),
    vendor_name: KNOWN_CONTROLLER_VENDORS[Number(fabric.vendorId)] || null,
    is_gladys: currentFabricIndex !== undefined && Number(fabric.fabricIndex) === Number(currentFabricIndex),
  }));
}

/**
 * @description The node sheet: status, last contact, firmware, network, controllers, devices, and the
 * actions the node allows. Live values are only read while the node is connected; otherwise the
 * sheet shows what matter.js remembers.
 * @param {bigint} nodeId - The node ID.
 * @returns {Promise<object>} The node sheet.
 * @example
 * const details = await matterHandler.getNodeDetails(1234n);
 */
async function getNodeDetails(nodeId) {
  if (!this.commissioningController) {
    throw new ServiceNotConfiguredError('Matter is not started');
  }
  const nodeDetail = this.commissioningController
    .getCommissionedNodesDetails()
    .find((detail) => detail.nodeId.toString() === nodeId.toString());
  if (!nodeDetail) {
    throw new NotFoundError(`Matter node ${nodeId} not found`);
  }
  const node = await this.commissioningController.getNode(nodeDetail.nodeId);
  const key = nodeId.toString();
  const basicInformation = getBasicInformation(node, nodeDetail);
  const nodeStatus = this.getNodeStatus(nodeDetail.nodeId, node);
  const rootEndpoint = typeof node.getRootEndpoint === 'function' ? node.getRootEndpoint() : undefined;
  const remote = Boolean(node.isConnected);
  const [network, controllers] = await Promise.all([
    readNetwork(node, rootEndpoint, remote),
    readControllers(rootEndpoint, remote),
  ]);
  const endpoints = collectEndpoints(node.getDevices());
  const gladysDevices = getGladysDevicesOfNode(this.gladys.stateManager, nodeDetail.nodeId).map((device) => {
    const { devicePath } = parseMatterExternalId(device.external_id);
    const availability = getMatterAvailability(nodeStatus.available, nodeStatus.unreachable_device_paths, devicePath);
    return {
      name: device.name,
      selector: device.selector,
      device_path: devicePath,
      available: availability.available,
      unavailable_reason: availability.reason,
    };
  });
  const bridgedDevices = Array.from((this.bridgedDevices.get(key) || new Map()).entries()).map(([path, name]) => ({
    path,
    name,
    reachable: !nodeStatus.unreachable_device_paths.includes(path),
  }));

  return {
    node_id: key,
    name: getNodeName(basicInformation),
    status: nodeStatus.status,
    available: nodeStatus.available,
    since: nodeStatus.since,
    last_contact: nodeStatus.last_contact,
    live: remote,
    information: {
      vendor_name: basicInformation.vendorName,
      vendor_id: basicInformation.vendorId,
      product_name: basicInformation.productName,
      product_id: basicInformation.productId,
      product_label: basicInformation.productLabel,
      node_label: basicInformation.nodeLabel,
      serial_number: basicInformation.serialNumber,
      unique_id: basicInformation.uniqueId,
      hardware_version: basicInformation.hardwareVersionString,
      software_version: basicInformation.softwareVersionString,
    },
    network,
    controllers,
    gladys_devices: gladysDevices,
    bridged_devices: bridgedDevices,
    capabilities: {
      identify: endpoints.some((endpoint) => Boolean(endpoint.getClusterClientById(Identify.Complete.id))),
      share: Boolean(rootEndpoint && rootEndpoint.getClusterClientById(AdministratorCommissioning.Complete.id)),
    },
  };
}

module.exports = {
  getNodeDetails,
  readAttribute,
};
