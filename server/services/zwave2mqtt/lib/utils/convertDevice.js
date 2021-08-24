const logger = require('../../../../utils/logger');
const { convertFeature } = require('./convertFeature');
const { getFeaturesByModel } = require('../model');
const { getDeviceExternalId } = require('./externalId');
const { getDeviceFeatureExternalId } = require('./externalId');

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
  const gladysDevices = [];
  const gladysDevice = {
    id: `nodeId_${device.id}`,
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
  gladysDevices.push(gladysDevice);

  const features = getFeaturesByModel(device.deviceId);
  const gladysDeviceEndpoints = {};
  if (features.length === 0) {
    gladysDevice.features = [];
    const cmdClasses = device.values;
    Object.keys(cmdClasses).forEach((cmdID) => {
      const cmd = cmdClasses[cmdID];
      const feature = convertFeature(device, cmd);
      if (feature) {
        if (cmd.endpoint > 0) {
          // Multiple endpoint -> create one more device per endpoint
          let gladysDeviceEndpoint = gladysDeviceEndpoints[cmd.endpoint];
          if (gladysDeviceEndpoint === undefined) {
            gladysDeviceEndpoint = {
              id: `nodeId_${device.id}_${cmd.endpoint}`,
              name: `${gladysDevice.name} - ${cmd.endpoint}`,
              model: gladysDevice.model,
              ready: device.ready,
              should_poll: false,
              external_id: getDeviceExternalId({
                node_id: device.id,
                endpoint: cmd.endpoint,
              }),
              service_id: serviceId,
              supported: true,
              params: [],
            };
            gladysDevices.push(gladysDeviceEndpoint);
            gladysDeviceEndpoints[cmd.endpoint] = gladysDeviceEndpoint;
            gladysDeviceEndpoint.features = [];
          }

          gladysDeviceEndpoint.features.push(feature);
        } else {
          gladysDevice.features.push(feature);
        }
      }
    });
  } else {
    features.forEach((feature) => {
      feature.external_id = getDeviceFeatureExternalId({
        node_id: device.id,
        class_id: feature.class_id,
        instance: feature.instance,
        propertyKey: feature.propertyKey,
      });
    });
    gladysDevice.features = features;
  }

  logger.debug(
    `Device ${device.id} managed by Gladys as ${gladysDevice.name} with ${gladysDevice.features.length} features`,
  );

  return gladysDevices;
}

module.exports = {
  convertDevice,
};
