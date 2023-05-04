const { buildFeatures } = require('./buildFeatures');

/**
 * @description Build a Gladys feature according to Zigbee "expose" and "features" values.
 * @param {string} deviceName - Device friendly name.
 * @param {object} expose - Zigbee "expose" values.
 * @param {string} parentType - Requested parent type.
 * @returns {object} The related Gladys feature, or undefined.
 * @example mapExpose('MyDevice', {}, 'light');
 */
function mapExpose(deviceName, expose, parentType = undefined) {
  const { type, features = [] } = expose;

  const matchingFeatures = [];

  // Merge default with specific
  const builtFeatures = buildFeatures(deviceName, expose, parentType);
  builtFeatures.forEach((feature) => {
    matchingFeatures.push(feature);
  });

  // Map exposed sub-features recursivly
  features.flatMap((f) => mapExpose(deviceName, f, parentType || type)).forEach((f) => matchingFeatures.push(f));

  return matchingFeatures;
}

module.exports = {
  mapExpose,
};
