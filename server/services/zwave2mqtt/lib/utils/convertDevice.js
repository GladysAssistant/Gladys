const logger = require('../../../../utils/logger');
const { convertFeature } = require('./convertFeature');
const { getDeviceExternalId } = require('./externalId');

// const { DEVICE_FEATURE_CATEGORIES } = require('../../../../../server/utils/constants');

/**
 * @description Converts an ZWAVE2MQTT device to a Gladys device.
 * @param {Object} device - Zwave2mqtt nodeInfo device.
 * @param {string} serviceId - Service ID.
 * @returns {Object} Device for Gladys.
 * @example
 * convertDevice({"id":118,
 * "deviceId":"345-83-2","manufacturer":"Qubino","manufacturerId":345,"productType":2,"productId":83,
 * "hexId":"0x0159-0x0002-0x0053","dbLink":"https://devices.zwave-js.io/?jumpTo=0x0159:0x0002:0x0053:0.0",
 * "productLabel":"ZMNHND","productDescription":"Flush 1D relay",
 * "deviceClass":{"basic":4,"generic":16,"specific":1},
 * "name":"","loc":"","neighbors":[xxx],"ready":true,"available":true,
 * "failed":false,"lastActive":1617529214096,"firmwareVersion":"4.0",
 * "supportsBeaming":true,"supportsSecurity":false,"isSecure":false,
 * "keepAwake":false,"maxBaudRate":null,"isRouting":true,
 * "isFrequentListening":false,"isListening":true,"inited":true,
 * "protocolVersion":3,"zwavePlusVersion":1,"zwavePlusNodeType":0,"zwavePlusRoleType":5,
 * "nodeType":1,"endpointsCount":0,"isControllerNode":false,"dataRate":100000,
 * "status":"Alive","interviewStage":"Complete"},
 * '6a37dd9d-48c7-4d09-a7bb-33f257edb78d');
 */
function convertDevice(device, serviceId) {
  const gladysDevice = {
    name: device.name || `${device.id} - ${device.productLabel}`,
    model: `${device.manufacturer} ${device.productLabel} ${device.productDescription}`,
    ready: device.ready,
    should_poll: false,
    external_id: getDeviceExternalId({
      node_id: device.id,
    }),
    service_id: serviceId,
    supported: true,
    params: [],
  };

  gladysDevice.features = convertFeature(device);

  logger.debug(
    `Device ${device.id} managed by Gladys as ${gladysDevice.name} with ${gladysDevice.features.length} features`,
  );
  return gladysDevice;
}

module.exports = {
  convertDevice,
};
