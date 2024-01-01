const get = require('get-value');

const { EXPOSES } = require('../lib/constants');

const cleanNames = (text) => {
  if (!text || typeof text !== 'string') {
    return '';
  }
  return text
    .replaceAll(' ', '_')
    .replaceAll('(', '')
    .replaceAll(')', '')
    .toLowerCase();
};

const getDeviceFeatureExternalId = (location, name, endpoint, comClass, property, propertyKey) =>
  `zwavejs-ui:${location}:${name}:${endpoint}:${comClass}:${property}:${propertyKey}`;

const convertToGladysDevice = (serviceId, device) => {
  const features = [];

  // Foreach value, we check if there is a matching feature in Gladys
  Object.keys(device.values).forEach((valueKey) => {
    const value = device.values[valueKey];
    const { commandClassName, property, propertyKey, endpoint } = value;
    const commandClassNameClean = cleanNames(commandClassName);
    const propertyClean = cleanNames(property);
    const propertyKeyClean = cleanNames(propertyKey);
    let exposePath = `${commandClassNameClean}.${propertyClean}`;
    if (propertyKeyClean !== '') {
      exposePath += `.${propertyKeyClean}`;
    }
    const exposeFound = get(EXPOSES, exposePath);
    if (exposeFound) {
      features.push({
        ...exposeFound,
        name: value.id,
        nodeId: value.nodeId,
        external_id: getDeviceFeatureExternalId(
          device.loc,
          device.name,
          endpoint,
          commandClassNameClean,
          propertyClean,
          propertyKeyClean,
        ),
      });
    }
  });

  return {
    name: device.name,
    external_id: `zwavejs-ui:${device.loc}:${device.name}`,
    service_id: serviceId,
    should_poll: false,
    features,
  };
};

module.exports = {
  cleanNames,
  getDeviceFeatureExternalId,
  convertToGladysDevice,
};
