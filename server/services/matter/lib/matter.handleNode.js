const Promise = require('bluebird');
// eslint-disable-next-line import/no-unresolved
const { BridgedDeviceBasicInformation } = require('@matter/main/clusters');
// eslint-disable-next-line import/no-unresolved
const { NodeStates } = require('@project-chip/matter.js/device');

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
  deviceInfos,
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
  const bridgedDeviceBasicInformationClusterClient = device.getClusterClientById(
    BridgedDeviceBasicInformation.Complete.id,
  );

  // We get all attributes for this child endpoint
  if (bridgedDeviceBasicInformationClusterClient) {
    if (Object.prototype.hasOwnProperty.call(bridgedDeviceBasicInformationClusterClient.attributes, 'vendorName')) {
      try {
        const vendorName = await bridgedDeviceBasicInformationClusterClient.attributes.vendorName.get();
        childInformations.vendorName = vendorName;
      } catch (e) {
        logger.warn(`Matter: Unable to read bridged vendorName for node ${nodeId}: ${e.message}`);
      }
    }

    if (Object.prototype.hasOwnProperty.call(bridgedDeviceBasicInformationClusterClient.attributes, 'nodeLabel')) {
      try {
        const nodeLabel = await bridgedDeviceBasicInformationClusterClient.attributes.nodeLabel.get();
        childInformations.nodeLabel = nodeLabel;
      } catch (e) {
        logger.warn(`Matter: Unable to read bridged nodeLabel for node ${nodeId}: ${e.message}`);
      }
    }

    if (Object.prototype.hasOwnProperty.call(bridgedDeviceBasicInformationClusterClient.attributes, 'productLabel')) {
      try {
        const productLabel = await bridgedDeviceBasicInformationClusterClient.attributes.productLabel.get();
        childInformations.productLabel = productLabel;
      } catch (e) {
        logger.warn(`Matter: Unable to read bridged productLabel for node ${nodeId}: ${e.message}`);
      }
    }

    if (Object.prototype.hasOwnProperty.call(bridgedDeviceBasicInformationClusterClient.attributes, 'productName')) {
      try {
        const productName = await bridgedDeviceBasicInformationClusterClient.attributes.productName.get();
        childInformations.productName = productName;
      } catch (e) {
        logger.warn(`Matter: Unable to read bridged productName for node ${nodeId}: ${e.message}`);
      }
    }

    if (Object.prototype.hasOwnProperty.call(bridgedDeviceBasicInformationClusterClient.attributes, 'uniqueId')) {
      try {
        const uniqueId = await bridgedDeviceBasicInformationClusterClient.attributes.uniqueId.get();
        childInformations.uniqueId = uniqueId;
      } catch (e) {
        logger.warn(`Matter: Unable to read bridged uniqueId for node ${nodeId}: ${e.message}`);
      }
    }

    if (Object.prototype.hasOwnProperty.call(bridgedDeviceBasicInformationClusterClient.attributes, 'serialNumber')) {
      try {
        const serialNumber = await bridgedDeviceBasicInformationClusterClient.attributes.serialNumber.get();
        childInformations.serialNumber = serialNumber;
      } catch (e) {
        logger.warn(`Matter: Unable to read bridged serialNumber for node ${nodeId}: ${e.message}`);
      }
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
    await listenToStateChange(nodeId, newDevicePath, device);
    devices.push(gladysDevice);
    deviceInfos.push({ device, path: newDevicePath });
  }

  const childEndpoints = device.getChildEndpoints();
  if (childEndpoints && childEndpoints.length > 0) {
    await Promise.each(childEndpoints, async (childDevice) => {
      await handleDevice(
        nodeId,
        childInformations,
        node,
        childDevice,
        devices,
        listenToStateChange,
        serviceId,
        `${newDevicePath}:child_endpoint`,
        deviceInfos,
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
  const { nodeId } = nodeDetail;
  logger.debug(`Matter: Handling node ${nodeId}`);
  if (!nodeDetail.deviceData) {
    logger.warn(`Matter: Node ${nodeId} has no device data`);
    return;
  }

  const node = await this.commissioningController.getNode(nodeId);
  this.nodesMap.set(nodeId, node);

  // Start background connection if not already connected
  if (!node.isConnected) {
    logger.info(`Matter: Node ${nodeId} not connected, starting connection...`);
    node.connect();
  }

  // Wait for local initialization from cached data before reading devices
  if (!node.initialized) {
    logger.info(`Matter: Node ${nodeId} waiting for local initialization...`);
    await node.events.initialized;
  }

  const devices = node.getDevices();
  const boundListenToStateChange = this.listenToStateChange.bind(this);
  const deviceInfos = [];

  await Promise.each(devices, async (device) => {
    logger.debug(`Matter: Handling device ${device.number}`);
    await handleDevice(
      nodeId,
      nodeDetail.deviceData.basicInformation,
      node,
      device,
      this.devices,
      boundListenToStateChange,
      this.serviceId,
      '',
      deviceInfos,
    );
  });

  // When node (re)connects, re-emit current cached state for all known devices
  node.events.stateChanged.on(async (nodeState) => {
    if (nodeState === NodeStates.Connected) {
      logger.info(`Matter: Node ${nodeId} connected, refreshing device states from cache`);
      await Promise.each(deviceInfos, async ({ device: d, path }) => {
        try {
          await boundListenToStateChange(nodeId, path, d);
        } catch (e) {
          logger.warn(`Matter: Error refreshing state for node ${nodeId}, path ${path}: ${e.message}`);
        }
      });
    }
  });
}

module.exports = {
  handleNode,
};
