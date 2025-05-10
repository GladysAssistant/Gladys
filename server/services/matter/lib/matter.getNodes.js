const Promise = require('bluebird');
const logger = require('../../../utils/logger');

const convertDevice = (device) => {
  const clusterClients = [];

  // Each cluster client is a feature of the device
  device.clusterClients.forEach((clusterClient, clusterIndex) => {
    clusterClients.push({
      id: clusterClient.id.toString(),
      name: clusterClient.name,
      attributes: Object.keys(clusterClient.attributes),
      commands: Object.keys(clusterClient.commands),
      all_keys: Object.keys(clusterClient),
    });
  });

  // Convert child endpoints (child devices)
  const childEndpoints = device.childEndpoints.map((childDeviceEndpoint) => {
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
 * @description Get the nodes.
 * @returns {Promise<Array>} The nodes.
 * @example
 * const nodes = await matterHandler.getNodes();
 */
async function getNodes() {
  const nodeDetails = this.commissioningController.getCommissionedNodesDetails();
  const filteredNodeDetails = nodeDetails.filter((nodeDetail) => {
    if (!nodeDetail.deviceData) {
      logger.warn(`Matter: Node ${nodeDetail.nodeId} has no device data`);
      return false;
    }
    return true;
  });
  return Promise.mapSeries(filteredNodeDetails, async (nodeDetail) => {
    const node = await this.commissioningController.getNode(nodeDetail.nodeId);
    const devices = node.getDevices();
    return {
      node_id: nodeDetail.nodeId.toString(),
      is_connected: node.isConnected,
      devices: devices.map((device) => {
        return convertDevice(device);
      }),
      node_information: {
        vendor_name: nodeDetail.deviceData.basicInformation.vendorName,
        product_name: nodeDetail.deviceData.basicInformation.productName,
        product_id: nodeDetail.deviceData.basicInformation.productId,
        product_label: nodeDetail.deviceData.basicInformation.productLabel,
        vendor_id: nodeDetail.deviceData.basicInformation.vendorId,
      },
    };
  });
}

module.exports = {
  getNodes,
};
