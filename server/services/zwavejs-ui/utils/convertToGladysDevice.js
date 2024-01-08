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

const getDeviceFeatureExternalId = (nodeId, commandClass, endpoint, property, propertyKey) =>
  `zwavejs-ui:${nodeId}:${commandClass}:${endpoint}:${property}${propertyKey ? `:${propertyKey}` : ''}`;

const getDeviceFeatureName = 
  (nodeId, commandClassName, endpoint, propertyName, propertyKeyName, commandClassVersion) => 
    `${nodeId}:${commandClassName}:${endpoint}:${propertyName}${propertyKeyName ? `:${propertyKeyName}` : ''}:${commandClassVersion}`;

const convertToGladysDevice = (serviceId, device) => {
  const features = [];

  // Foreach value, we check if there is a matching feature in Gladys
  Object.keys(device.values).forEach((valueKey) => {
    const value = device.values[valueKey];
    const { commandClass, commandClassName, property, propertyKey, endpoint, commandClassVersion = 1 } = value;
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
        // Name is used to store the commandClassVersion
        name: getDeviceFeatureName(
          value.nodeId,
          commandClassNameClean,
          endpoint,
          propertyClean,
          propertyKeyClean,
          commandClassVersion),
        external_id: getDeviceFeatureExternalId(
          value.nodeId,
          commandClass,
          endpoint,
          propertyClean,
          propertyKeyClean
        ),
      });
    }
  });

  return {
    name: device.name,
    external_id: `zwavejs-ui:${device.id}`,
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
