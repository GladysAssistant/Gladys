const cleanNames = require('./cleanNames');

const { EXPOSES, PARAMS, COMMANDCLASS } = require('../lib/constants');
const getProperty = require('./getProperty');

const getDeviceFeatureId = (nodeId, commandClassName, endpoint, propertyName, propertyKeyName, featureName) => {
  const propertyKeyNameClean = cleanNames(propertyKeyName);
  return `zwavejs-ui:${nodeId}:${endpoint}:${cleanNames(commandClassName)}:${cleanNames(propertyName)}${
    propertyKeyNameClean !== '' ? `:${propertyKeyNameClean}` : ''
  }${featureName !== '' ? `:${featureName}` : ''}`;
};

/**
 * @description Cleanup features.
 * For example: remove a Binary Switch sent by a device on a
 * Multilevel Switch (we do manage a virtual one on Gladys).
 * @param {Array} features - Detected features on the node.
 * @returns {Array} The cleaned up features.
 * @example cleanupFeatures(features)
 */
function cleanupFeatures(features) {
  let localFeatures = features;
  // ------------------------------
  // Multilevel Switch special case
  // Some Multilevel Switch device have an explicit Binary Switch
  // exposed some others not (Qubino vs Fibaro for example). As for
  // devices that do not expose any Binary Switch value, we manage
  // a virtual one through the Multilevel Switch. In order to improve
  // the user experience, we so cleanup any explicit Binary Switch
  // so the user doesn't see too many options when managing their device
  // (we keep the virtual one because it is correctly synchronized with
  // others features - state & position - and keeps code simpler)
  if (localFeatures.some((f) => f.command_class === COMMANDCLASS.MULTILEVEL_SWITCH)) {
    localFeatures = localFeatures.filter((f) => f.command_class !== COMMANDCLASS.BINARY_SWITCH);
  }

  // Add any other special cleanup necessary... Please, provide an explanation

  return localFeatures;
}

const convertToGladysDevice = (serviceId, zwaveJsDevice) => {
  const features = [];
  let params = [];

  // Foreach value, we check if there is a matching feature in Gladys
  Object.keys(zwaveJsDevice.values).forEach((valueKey) => {
    const value = zwaveJsDevice.values[valueKey];
    const { commandClass, commandClassName, propertyName, propertyKeyName, endpoint, commandClassVersion = 1 } = value;

    let exposes = getProperty(EXPOSES, commandClassName, propertyName, propertyKeyName, zwaveJsDevice.deviceClass);
    if (exposes) {
      if (!Array.isArray(exposes)) {
        exposes = [
          {
            name: '',
            feature: exposes,
          },
        ];
      }

      exposes.forEach((exposeFound) => {
        features.push({
          ...exposeFound.feature,
          name: `${value.id}${exposeFound.name !== '' ? `:${exposeFound.name}` : ''}`,
          external_id: getDeviceFeatureId(
            zwaveJsDevice.id,
            commandClassName,
            endpoint,
            propertyName,
            propertyKeyName,
            exposeFound.name,
          ),
          selector: getDeviceFeatureId(
            zwaveJsDevice.id,
            commandClassName,
            endpoint,
            propertyName,
            propertyKeyName,
            exposeFound.name,
          ),
          node_id: zwaveJsDevice.id,
          // These are custom properties only available on the object in memory (not in DB)
          command_class_version: commandClassVersion,
          command_class_name: commandClassName,
          command_class: commandClass,
          endpoint,
          property_name: propertyName,
          property_key_name: propertyKeyName,
          feature_name: exposeFound.name,
        });
      });
    }
    params = [{ name: PARAMS.LOCATION, value: zwaveJsDevice.loc }];
  });

  return {
    name: zwaveJsDevice.name || '',
    external_id: `zwavejs-ui:${zwaveJsDevice.id}`,
    selector: `zwavejs-ui:${zwaveJsDevice.id}`,
    service_id: serviceId,
    should_poll: false,
    features: cleanupFeatures(features),
    params,
  };
};

module.exports = {
  getDeviceFeatureId,
  convertToGladysDevice,
};
