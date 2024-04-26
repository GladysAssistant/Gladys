const get = require('get-value');

const { EXPOSES, PARAMS } = require('../lib/constants');

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

const getDeviceFeatureId = (nodeId, commandClassName, endpoint, propertyName, propertyKeyName) => {
  const propertyKeyNameClean = cleanNames(propertyKeyName);
  return `zwavejs-ui:${nodeId}:${endpoint}:${cleanNames(commandClassName)}:${cleanNames(propertyName)}${
    propertyKeyNameClean !== '' ? `:${propertyKeyNameClean}` : ''
  }`;
};

const convertToGladysDevice = (serviceId, device) => {
  const features = [];
  let params = [];

  // Foreach value, we check if there is a matching feature in Gladys
  Object.keys(device.values).forEach((valueKey) => {
    const value = device.values[valueKey];
    const { commandClass, commandClassName, propertyName, propertyKeyName, endpoint, commandClassVersion = 1 } = value;
    const commandClassNameClean = cleanNames(commandClassName);
    const propertyClean = cleanNames(propertyName);
    const propertyKeyClean = cleanNames(propertyKeyName);

    // Some devices have the same command class and property. But we need to classify 
    // the device to map to the right CATEGORY. We use for that the deviceClass property.
    // We try to find an exposed feature specific to the deviceClass first.
    // For example: Multilevel Switch devices. They might be curtains or light switch.
    // They use the same command class. Only the deviceClass could provide some hints
    // about the real intention of the device.
    let baseExposePath = propertyClean;
    if (propertyKeyClean !== '') {
      baseExposePath += `.${propertyKeyClean}`;
    }

    const exposeFound = 
         get(EXPOSES, `${commandClassNameClean}.${device.deviceClass.generic}-${device.deviceClass.specific}.${baseExposePath}`) 
      || get(EXPOSES, `${commandClassNameClean}.${baseExposePath}`);
    if (exposeFound) {
      features.push({
        ...exposeFound,
        name: value.id,
        external_id: getDeviceFeatureId(device.id, commandClassName, endpoint, propertyName, propertyKeyName),
        selector: getDeviceFeatureId(device.id, commandClassName, endpoint, propertyName, propertyKeyName),
        node_id: device.id,
        // These are custom properties only available on the object in memory (not in DB)
        command_class_version: commandClassVersion,
        command_class_name: commandClassName,
        command_class: commandClass,
        endpoint,
        property_name: propertyName,
        property_key_name: propertyKeyName,
      });
    }
    params = [{ name: PARAMS.LOCATION, value: device.loc }];
  });

  return {
    name: device.name,
    external_id: `zwavejs-ui:${device.id}`,
    selector: `zwavejs-ui:${device.id}`,
    service_id: serviceId,
    should_poll: false,
    features,
    params,
  };
};

module.exports = {
  cleanNames,
  getDeviceFeatureId,
  convertToGladysDevice,
};
