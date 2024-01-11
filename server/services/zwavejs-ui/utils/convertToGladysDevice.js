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

const getDeviceFeatureId = (nodeId, commandClass, endpoint, property, propertyKey) => {
  const propertyKeyClean = cleanNames(propertyKey);
  return `zwavejs-ui:${nodeId}-${commandClass}-${endpoint}-${cleanNames(property)}${propertyKeyClean !== '' ? `-${propertyKeyClean}` : ''}`;
};

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
        name: value.id,
        external_id: getDeviceFeatureId(device.id, commandClass, endpoint, property, propertyKey),
        node_id: device.id,
        // These are custom properties only available on the object in memory (not in DB)
        command_class_version: commandClassVersion,
        command_class_name: commandClassName,
        command_class: commandClass,
        endpoint,
        property,
        property_key: propertyKey,
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
  getDeviceFeatureId,
  convertToGladysDevice,
};
