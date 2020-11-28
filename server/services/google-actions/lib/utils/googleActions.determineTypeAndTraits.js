const deviceTypes = require('../deviceTypes');
const { determineTrait } = require('./googleActions.determineTrait');

/**
 * @description Determine Google Actions device type from Galdys device.
 * @param {Object} device - Gladys device.
 * @returns {Object} GoogleActions device type and traits.
 * @example
 * determineTypeAndTraits(device);
 */
function determineTypeAndTraits(device) {
  const featureCategoryTypes = {};
  let type;
  const traits = [];
  let attributes = {};

  device.features.forEach((feature) => {
    const { category } = feature;

    if (!featureCategoryTypes[category]) {
      featureCategoryTypes[category] = [];
    }

    const matchingTrait = determineTrait(feature);
    if (matchingTrait) {
      traits.push(matchingTrait.key);

      if (typeof matchingTrait.generateAttributes === 'function') {
        attributes = { ...attributes, ...matchingTrait.generateAttributes(device) };
      }
    }

    featureCategoryTypes[category].push(1);
  });

  // Matching device type
  let nbFeatureTypeMatches = 0;
  deviceTypes.forEach((deviceType) => {
    const nbFeatureTypeMatch = (featureCategoryTypes[deviceType.category] || []).length;

    if (nbFeatureTypeMatch > nbFeatureTypeMatches) {
      type = deviceType.key;
      nbFeatureTypeMatches = nbFeatureTypeMatch;
    }
  });

  return { traits, attributes, type };
}

module.exports = {
  determineTypeAndTraits,
};
