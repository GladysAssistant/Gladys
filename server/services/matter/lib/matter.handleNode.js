const Promise = require('bluebird');
// eslint-disable-next-line import/no-unresolved
const { BridgedDeviceBasicInformation } = require('@matter/main/clusters');
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
  let newDevicePath = devicePath;
  if (devicePath) {
    newDevicePath = `${devicePath}:${device.number}`;
  } else {
    newDevicePath = `${device.number}`;
  }
  const gladysDevice = await convertToGladysDevice(serviceId, nodeId, device, deviceBasicInformation, newDevicePath);
  if (gladysDevice.features.length > 0) {
    listenToStateChange(nodeId, newDevicePath, device);
    devices.push(gladysDevice);
  }
  // If we have this cluster, it means we are in a bridge devic
  const bridgedDeviceBasicInformation = device.clusterClients.get(BridgedDeviceBasicInformation.Complete.id);

  if (device.childEndpoints) {
    await Promise.each(device.childEndpoints, async (childDevice) => {
      await handleDevice(
        nodeId,
        bridgedDeviceBasicInformation || deviceBasicInformation,
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
  const node = await this.commissioningController.getNode(nodeDetail.nodeId);
  this.nodesMap.set(nodeDetail.nodeId, node);
  const devices = node.getDevices();
  const boundListenToStateChange = this.listenToStateChange.bind(this);
  await Promise.each(devices, async (device) => {
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
