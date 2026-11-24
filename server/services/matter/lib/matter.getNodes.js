const Promise = require('bluebird');
const logger = require('../../../utils/logger');
const { getGladysDevicesOfNode } = require('../utils/getGladysDevicesOfNode');
const { getBasicInformation, getNodeName, getNetworkType } = require('../utils/matterNodeInformation');

const convertDevice = (device) => {
  const clusterClients = [];

  // Each cluster client is a feature of the device
  const allClusterClients = device.getAllClusterClients();
  allClusterClients.forEach((clusterClient) => {
    clusterClients.push({
      id: clusterClient.id.toString(),
      name: clusterClient.name,
      attributes: Object.keys(clusterClient.attributes),
      commands: Object.keys(clusterClient.commands),
      all_keys: Object.keys(clusterClient),
    });
  });

  // Convert child endpoints (child devices)
  const childEndpointsList = device.getChildEndpoints();
  const childEndpoints = childEndpointsList.map((childDeviceEndpoint) => {
    return convertDevice(childDeviceEndpoint);
  });

  return {
    name: device.name,
    number: device.number.toString(),
    cluster_clients: clusterClients,
    child_endpoints: childEndpoints,
  };
};

/**
 * @description Get the nodes, with what the user needs to know about each of them: its name, its
 * connection status, its firmware and its network. The endpoint and cluster tree (expert mode) is
 * only listed when asked.
 * @param {object} [options] - Options.
 * @param {boolean} [options.withGladysDevices] - Also list the Gladys devices created from each node
 * (shown before a decommission).
 * @param {boolean} [options.withClusters] - Also list the endpoints and clusters of each node.
 * @returns {Promise<Array>} The nodes.
 * @example
 * const nodes = await matterHandler.getNodes({ withGladysDevices: true });
 */
async function getNodes({ withGladysDevices = false, withClusters = false } = {}) {
  const nodeDetails = this.commissioningController.getCommissionedNodesDetails();
  const filteredNodeDetails = nodeDetails.filter((nodeDetail) => {
    if (!nodeDetail.deviceData || !nodeDetail.deviceData.basicInformation) {
      logger.warn(`Matter: Node ${nodeDetail.nodeId} has no device data or basic information`);
      return false;
    }
    return true;
  });
  return Promise.mapSeries(filteredNodeDetails, async (nodeDetail) => {
    const node = await this.commissioningController.getNode(nodeDetail.nodeId);
    const basicInformation = getBasicInformation(node, nodeDetail);
    const nodeStatus = this.getNodeStatus(nodeDetail.nodeId, node);
    return {
      node_id: nodeDetail.nodeId.toString(),
      name: getNodeName(basicInformation),
      is_connected: node.isConnected,
      status: nodeStatus.status,
      available: nodeStatus.available,
      last_contact: nodeStatus.last_contact,
      unreachable_device_paths: nodeStatus.unreachable_device_paths,
      network_type: getNetworkType(node),
      ...(withGladysDevices && {
        gladys_devices: getGladysDevicesOfNode(this.gladys.stateManager, nodeDetail.nodeId),
      }),
      ...(withClusters && {
        devices: node.getDevices().map((device) => convertDevice(device)),
      }),
      node_information: {
        vendor_name: basicInformation.vendorName,
        product_name: basicInformation.productName,
        product_id: basicInformation.productId,
        product_label: basicInformation.productLabel,
        vendor_id: basicInformation.vendorId,
        node_label: basicInformation.nodeLabel,
        software_version: basicInformation.softwareVersionString,
      },
    };
  });
}

module.exports = {
  getNodes,
};
