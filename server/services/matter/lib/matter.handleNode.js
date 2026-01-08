const Promise = require('bluebird');
// eslint-disable-next-line import/no-unresolved
const { BridgedDeviceBasicInformation } = require('@matter/main/clusters');

const logger = require('../../../utils/logger');
const { convertToGladysDevice } = require('../utils/convertToGladysDevice');

const handleDevice = async (
  nodeId,
  deviceBasicInformation,
  node,
  device,
  devices,
  listenToStateChange,
  serviceId,
  devicePath,
) => {
  // Create a completely new object for child informations
  const childInformations = {
    vendorName: deviceBasicInformation.vendorName,
    nodeLabel: deviceBasicInformation.nodeLabel,
    productLabel: deviceBasicInformation.productLabel,
    productName: deviceBasicInformation.productName,
    uniqueId: deviceBasicInformation.uniqueId,
    serialNumber: deviceBasicInformation.serialNumber,
  };

  // If we have this cluster, it means we are in a bridge device
  const bridgedDeviceBasicInformationClusterClient = device.clusterClients.get(
    BridgedDeviceBasicInformation.Complete.id,
  );

  // We get all attributes for this child endpoint
  if (bridgedDeviceBasicInformationClusterClient) {
    if (Object.prototype.hasOwnProperty.call(bridgedDeviceBasicInformationClusterClient.attributes, 'vendorName')) {
      const vendorName = await bridgedDeviceBasicInformationClusterClient.attributes.vendorName.get();
      childInformations.vendorName = vendorName;
    }

    if (Object.prototype.hasOwnProperty.call(bridgedDeviceBasicInformationClusterClient.attributes, 'nodeLabel')) {
      const nodeLabel = await bridgedDeviceBasicInformationClusterClient.attributes.nodeLabel.get();
      childInformations.nodeLabel = nodeLabel;
    }

    if (Object.prototype.hasOwnProperty.call(bridgedDeviceBasicInformationClusterClient.attributes, 'productLabel')) {
      const productLabel = await bridgedDeviceBasicInformationClusterClient.attributes.productLabel.get();
      childInformations.productLabel = productLabel;
    }

    if (Object.prototype.hasOwnProperty.call(bridgedDeviceBasicInformationClusterClient.attributes, 'productName')) {
      const productName = await bridgedDeviceBasicInformationClusterClient.attributes.productName.get();
      childInformations.productName = productName;
    }

    if (Object.prototype.hasOwnProperty.call(bridgedDeviceBasicInformationClusterClient.attributes, 'uniqueId')) {
      const uniqueId = await bridgedDeviceBasicInformationClusterClient.attributes.uniqueId.get();
      childInformations.uniqueId = uniqueId;
    }

    if (Object.prototype.hasOwnProperty.call(bridgedDeviceBasicInformationClusterClient.attributes, 'serialNumber')) {
      const serialNumber = await bridgedDeviceBasicInformationClusterClient.attributes.serialNumber.get();
      childInformations.serialNumber = serialNumber;
    }
  }

  let newDevicePath = devicePath;

  // If there is already a parent path, it means we are in a child endpoints
  // And we need to append the parent endpoint
  if (devicePath) {
    newDevicePath = `${devicePath}:${device.number}`;
  } else {
    newDevicePath = `${device.number}`;
  }

  const gladysDevice = await convertToGladysDevice(serviceId, nodeId, device, childInformations, newDevicePath);

  // If the device has features that Gladys can handle, we add it to Gladys, otherwise we don't add it
  // to avoid bloating Gladys
  if (gladysDevice.features.length > 0) {
    listenToStateChange(nodeId, newDevicePath, device);
    devices.push(gladysDevice);
  }

  if (device.childEndpoints) {
    await Promise.each(device.childEndpoints, async (childDevice, index) => {
      await handleDevice(
        nodeId,
        childInformations,
        node,
        childDevice,
        devices,
        listenToStateChange,
        serviceId,
        `${newDevicePath}:child_endpoint`,
      );
    });
  }
};

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
  this.nodesMap.set(nodeDetail.nodeId, node);
  const devices = node.getDevices();
  const boundListenToStateChange = this.listenToStateChange.bind(this);
  await Promise.each(devices, async (device) => {
    logger.debug(`Matter: Handling device ${device.number}`);
    await handleDevice(
      nodeDetail.nodeId,
      nodeDetail.deviceData.basicInformation,
      node,
      device,
      this.devices,
      boundListenToStateChange,
      this.serviceId,
      '',
    );
  });
}

module.exports = {
  handleNode,
};
