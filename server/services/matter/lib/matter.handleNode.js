const Promise = require('bluebird');
const { convertToGladysDevice } = require('../utils/convertToGladysDevice');

const handleDevice = async (nodeDetail, node, device, devices, listenToStateChange, serviceId, devicePath) => {
  let newDevicePath = devicePath;
  if (devicePath) {
    newDevicePath = `${devicePath}:${device.number}`;
  } else {
    newDevicePath = `${device.number}`;
  }
  const gladysDevice = await convertToGladysDevice(
    serviceId,
    nodeDetail.nodeId,
    device,
    nodeDetail.deviceData,
    newDevicePath,
  );
  if (gladysDevice.features.length > 0) {
    listenToStateChange(nodeDetail.nodeId, newDevicePath, device);
    devices.push(gladysDevice);
  }
  if (device.childEndpoints) {
    await Promise.each(device.childEndpoints, async (childDevice) => {
      await handleDevice(
        nodeDetail,
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
    await handleDevice(nodeDetail, node, device, this.devices, boundListenToStateChange, this.serviceId, '');
  });
}

module.exports = {
  handleNode,
};
