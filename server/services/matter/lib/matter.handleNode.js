const Promise = require('bluebird');
// eslint-disable-next-line import/no-unresolved
const { BridgedDeviceBasicInformation } = require('@matter/main/clusters');

const logger = require('../../../utils/logger');
const { convertToGladysDevice } = require('../utils/convertToGladysDevice');
const { ensureNodeConnected } = require('../utils/ensureNodeConnected');
const { getEndpointRole } = require('../utils/endpointRoleMapping');
const { firstFilledLabel } = require('../utils/matterNodeInformation');

const BRIDGED_INFORMATION_ATTRIBUTES = [
  'vendorName',
  'nodeLabel',
  'productLabel',
  'productName',
  'uniqueId',
  'serialNumber',
];

/**
 * @description Follows whether the bridge can reach a bridged device (BridgedDeviceBasicInformation.reachable).
 * @param {object} matterHandler - The Matter handler.
 * @param {bigint} nodeId - The node ID of the bridge.
 * @param {string} devicePath - The path of the bridged device.
 * @param {object} clusterClient - The BridgedDeviceBasicInformation cluster client of the bridged device.
 * @example
 * await watchReachability(matterHandler, nodeId, '1:child_endpoint:3', clusterClient);
 */
async function watchReachability(matterHandler, nodeId, devicePath, clusterClient) {
  if (!Object.prototype.hasOwnProperty.call(clusterClient.attributes, 'reachable')) {
    return;
  }
  try {
    const reachable = await clusterClient.attributes.reachable.get();
    matterHandler.setDeviceReachability(nodeId, devicePath, reachable);
  } catch (e) {
    logger.debug(`Matter: Unable to read the reachability of ${devicePath} on node ${nodeId}: ${e}`);
  }
  // the listener survives the refreshes: matter.js keeps the same cluster client object
  if (!matterHandler.stateChangeListeners.has(clusterClient)) {
    matterHandler.stateChangeListeners.add(clusterClient);
    clusterClient.addReachableAttributeListener((reachable) => {
      matterHandler.setDeviceReachability(nodeId, devicePath, reachable);
    });
  }
}

const handleDevice = async (context, device, deviceBasicInformation, devicePath) => {
  const { matterHandler, nodeId, devices } = context;
  // Create a completely new object for child informations
  const childInformations = {
    vendorName: deviceBasicInformation.vendorName,
    nodeLabel: deviceBasicInformation.nodeLabel,
    productLabel: deviceBasicInformation.productLabel,
    productName: deviceBasicInformation.productName,
    uniqueId: deviceBasicInformation.uniqueId,
    serialNumber: deviceBasicInformation.serialNumber,
    // the product the endpoint belongs to: the node, or the bridged device above it (naming)
    namingProduct: deviceBasicInformation.namingProduct,
    namingGroup: deviceBasicInformation.namingGroup,
  };

  let newDevicePath = devicePath;

  // If there is already a parent path, it means we are in a child endpoints
  // And we need to append the parent endpoint
  if (devicePath) {
    newDevicePath = `${devicePath}:${device.number}`;
  } else {
    newDevicePath = `${device.number}`;
  }

  // If we have this cluster, it means we are in a bridge device
  const bridgedDeviceBasicInformationClusterClient = device.getClusterClientById(
    BridgedDeviceBasicInformation.Complete.id,
  );

  // We get all attributes for this child endpoint
  if (bridgedDeviceBasicInformationClusterClient) {
    const bridgedInformations = {};
    await Promise.each(BRIDGED_INFORMATION_ATTRIBUTES, async (attributeName) => {
      if (Object.prototype.hasOwnProperty.call(bridgedDeviceBasicInformationClusterClient.attributes, attributeName)) {
        bridgedInformations[attributeName] = await bridgedDeviceBasicInformationClusterClient.attributes[
          attributeName
        ].get();
        childInformations[attributeName] = bridgedInformations[attributeName];
      }
    });
    const bridgedProduct = firstFilledLabel([
      bridgedInformations.nodeLabel,
      bridgedInformations.productLabel,
      bridgedInformations.productName,
    ]);
    // a bridged device without any label of its own is named after the bridge, within the bridge
    if (bridgedProduct) {
      childInformations.namingProduct = bridgedProduct;
      childInformations.namingGroup = newDevicePath;
    }
    const bridgedDevicesOfNode = matterHandler.bridgedDevices.get(nodeId.toString()) || new Map();
    bridgedDevicesOfNode.set(newDevicePath, bridgedProduct || `${device.number}`);
    matterHandler.bridgedDevices.set(nodeId.toString(), bridgedDevicesOfNode);
    await watchReachability(matterHandler, nodeId, newDevicePath, bridgedDeviceBasicInformationClusterClient);
  }

  const gladysDevice = await convertToGladysDevice(
    matterHandler.serviceId,
    nodeId,
    device,
    childInformations,
    newDevicePath,
  );

  // If the device has features that Gladys can handle, we add it to Gladys, otherwise we don't add it
  // to avoid bloating Gladys
  if (gladysDevice.features.length > 0) {
    await matterHandler.listenToStateChange(nodeId, newDevicePath, device);
    gladysDevice.matter_naming = {
      product: childInformations.namingProduct,
      role: getEndpointRole(device),
      group: childInformations.namingGroup,
    };
    devices.push(gladysDevice);
  }

  const childEndpoints = device.getChildEndpoints();
  if (childEndpoints && childEndpoints.length > 0) {
    await Promise.each(childEndpoints, async (childDevice) => {
      await handleDevice(context, childDevice, childInformations, `${newDevicePath}:child_endpoint`);
    });
  }
};

/**
 * @description Completes the naming hints of the devices of a node: how many devices share their
 * product, and their rank among the ones sharing the same role. The front builds the readable name
 * from them, in the language of the user ("Plug – Outlet 2").
 * @param {Array} devices - The Gladys devices of one node, with matter_naming { product, role, group }.
 * @example
 * completeNamingHints(devices);
 */
function completeNamingHints(devices) {
  const groups = new Map();
  devices.forEach((device) => {
    const groupDevices = groups.get(device.matter_naming.group) || [];
    groupDevices.push(device);
    groups.set(device.matter_naming.group, groupDevices);
  });
  groups.forEach((groupDevices) => {
    groupDevices.forEach((device) => {
      const sameRole = groupDevices.filter((other) => other.matter_naming.role === device.matter_naming.role);
      const { product, role } = device.matter_naming;
      device.matter_naming = {
        product,
        role,
        index: sameRole.indexOf(device) + 1,
        count: sameRole.length,
        alone: groupDevices.length === 1,
      };
    });
  });
}

/**
 * @description Handle a Matter node.
 * @param {object} nodeDetail - The Matter node detail.
 * @example
 * await handleNode(nodeDetail);
 */
async function handleNode(nodeDetail) {
  logger.debug(`Matter: Handling node ${nodeDetail.nodeId}`);
  if (!nodeDetail.deviceData) {
    logger.warn(`Matter: Node ${nodeDetail.nodeId} has no device data`);
    return;
  }
  const node = await this.commissioningController.getNode(nodeDetail.nodeId);
  // follow its connection before connecting it, so that the status shown is the one of matter.js
  this.watchNode(nodeDetail.nodeId, node);
  const isConnected = await ensureNodeConnected(node, { nodeId: nodeDetail.nodeId });
  if (!isConnected) {
    logger.warn(`Matter: Node ${nodeDetail.nodeId} is unreachable, device discovery will continue without live state`);
  }
  this.nodesMap.set(nodeDetail.nodeId, node);
  const { basicInformation } = nodeDetail.deviceData;
  const nodeInformations = {
    ...basicInformation,
    namingProduct: firstFilledLabel([
      basicInformation.nodeLabel,
      basicInformation.productLabel,
      basicInformation.productName,
      basicInformation.vendorName,
    ]),
    namingGroup: '',
  };
  // the devices of this node only: several nodes are handled at the same time (refreshDevices)
  const nodeDevices = [];
  const context = { matterHandler: this, nodeId: nodeDetail.nodeId, devices: nodeDevices };
  try {
    await Promise.each(node.getDevices(), async (device) => {
      logger.debug(`Matter: Handling device ${device.number}`);
      await handleDevice(context, device, nodeInformations, '');
    });
  } finally {
    // an endpoint which fails (a bridged device that can not be read) does not hide the devices
    // already discovered on this node; the error still goes up to the caller
    completeNamingHints(nodeDevices);
    this.devices.push(...nodeDevices);
  }
  logger.info(
    `Matter: Node ${nodeDetail.nodeId} handled, ${nodeDevices.length} device(s) with features (${
      isConnected ? 'connected' : 'offline'
    })`,
  );
}

module.exports = {
  handleNode,
  completeNamingHints,
};
