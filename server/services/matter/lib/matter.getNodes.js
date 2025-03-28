/**
 * @description Get the nodes.
 * @returns {Array} The nodes.
 * @example
 * const nodes = matterHandler.getNodes();
 */
function getNodes() {
  const nodeDetails = this.commissioningController.getCommissionedNodesDetails();
  return nodeDetails.map((nodeDetail) => {
    return {
      node_id: nodeDetail.nodeId.toString(),
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
