const Promise = require('bluebird');

/**
 * @description Get the nodes.
 * @returns {Promise<Array>} The nodes.
 * @example
 * const nodes = await matterHandler.getNodes();
 */
async function getNodes() {
  const nodeDetails = this.commissioningController.getCommissionedNodesDetails();
  return Promise.mapSeries(nodeDetails, async (nodeDetail) => {
    const node = await this.commissioningController.getNode(nodeDetail.nodeId);
    const devices = node.getDevices();
    return {
      node_id: nodeDetail.nodeId.toString(),
      devices: devices.map((device) => {
        const clusterClients = [];

        device.clusterClients.forEach((clusterClient, clusterIndex) => {
          clusterClients.push({
            id: clusterClient.id.toString(),
            name: clusterClient.name,
            attributes: Object.keys(clusterClient.attributes),
            commands: Object.keys(clusterClient.commands),
            all_keys: Object.keys(clusterClient),
          });
        });

        return {
          name: device.name,
          number: device.number.toString(),
          cluster_clients: clusterClients,
        };
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
