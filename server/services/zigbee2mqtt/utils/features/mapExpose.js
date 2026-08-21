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

  // A "composite" expose mapped to a Gladys feature owns its sub-features: they are only parts
  // of the payload of a single command (e.g. the siren "warning" command) and can't be set on
  // their own, so they must not become standalone Gladys features.
  if (type === 'composite' && builtFeatures.length > 0) {
    return matchingFeatures;
  }

  // Map exposed sub-features recursivly
  features.flatMap((f) => mapExpose(deviceName, f, parentType || type)).forEach((f) => matchingFeatures.push(f));

  return matchingFeatures;
}

module.exports = {
  mapExpose,
};
