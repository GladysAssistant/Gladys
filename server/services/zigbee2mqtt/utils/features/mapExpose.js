const { buildFeature } = require('./buildFeature');

/**
 * @description Build a Gladys feature according to Zigbee "expose" and "features" values.
 * @param {string} deviceName - Device friendly name.
 * @param {Object} expose - Zigbee "expose" values.
 * @param {string} parentType - Requested parent type.
 * @returns {Object} The related Gladys feature, or undefined.
 *
 * @example mapExpose('MyDevice', {}, 'light');
 */
function mapExpose(deviceName, expose, parentType = undefined) {
  const { type, features = [] } = expose;

  const matchingFeatures = [];

  // Merge default with specific
  const feature = buildFeature(deviceName, expose, parentType);
  if (feature) {
    matchingFeatures.push(feature);
  }

  // Map exposed sub-features recursivly
  features.flatMap((f) => mapExpose(deviceName, f, parentType || type)).forEach((f) => matchingFeatures.push(f));

  return matchingFeatures;
}

module.exports = {
  mapExpose,
};
