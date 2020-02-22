const logger = require('../../../../utils/logger');
const { CAPABILITY_BY_FEATURE_CATEGORY } = require('./capabilities');

/**
 * @description Determines the SmartThings device handler according to Gladys device features.
 * @param {Array} features - Device features.
 * @returns {Object} Selected handler.
 *
 * @see https://smartthings.developer.samsung.com/docs/devices/smartthings-schema/device-handler-types.html#Reference
 *
 * @example
 * generateDeviceState(device.features);
 */
function generateDeviceState(features = []) {
  const states = [];

  features.forEach((feature) => {
    const capabilityObj = (CAPABILITY_BY_FEATURE_CATEGORY[feature.category] || {})[feature.type];

    if (capabilityObj) {
      const { attributes, capability } = capabilityObj;
      attributes.forEach((attribute) => {
        const { featureType, properties, name } = attribute;
        if (!featureType || featureType === feature.type) {
          const state = {
            component: 'main',
            capability: capability.id,
            attribute: name,
          };

          properties.forEach((property) => {
            state[property.name] = property.writeValue(feature);
          });

          states.push(state);
        }
      });
    } else {
      logger.warn(`SmartThings doesn't handle ${feature.category} / ${feature.type} feature yet.`);
    }
  });

  if (states.length > 0) {
    states.push({
      component: 'main',
      capability: 'st.healthCheck',
      attribute: 'healthStatus',
      value: states.length ? 'online' : 'offline',
    });
  }

  return states;
}

module.exports = {
  generateDeviceState,
};
