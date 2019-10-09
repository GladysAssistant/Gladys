const logger = require('../../../../utils/logger');
const { CAPABILITY_BY_FEATURE_CATEGORY } = require('../utils/capabilities');

/**
 * @description Determines the SmartThings device handler according to Gladys device features.
 * @param {Array} features - Device features.
 * @returns {Object} Selected handler.
 *
 * @see https://smartthings.developer.samsung.com/docs/devices/smartthings-schema/device-handler-types.html#Reference
 *
 * @example
 * getDeviceState(device.features);
 */
function getDeviceState(features) {
  const states = [];

  features.forEach((feature) => {
    const capability = (CAPABILITY_BY_FEATURE_CATEGORY[feature.category] || {})[feature.type];

    if (capability) {
      capability.attributes.forEach((attribute) => {
        if (!attribute.type || attribute.type === feature.type) {
          const state = {
            component: 'main',
            capability: `st.${capability.capability.id}`,
            attribute: attribute.name,
          };

          attribute.properties.forEach((property) => {
            state[property.name] = property.mapper(feature);
          });

          states.push(state);
        }
      });
    } else {
      logger.warn(`SmartThings doesn't handle ${feature.category} / ${feature.type} feature yet.`);
    }
  });

  states.push({
    component: 'main',
    capability: 'st.healthCheck',
    attribute: 'healthStatus',
    value: states.length ? 'online' : 'offline',
  });

  return states;
}

module.exports = {
  getDeviceState,
};
