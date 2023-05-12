const deviceTypes = require('../deviceTypes');
const { determineTrait } = require('./googleActions.determineTrait');

/**
 * @description Determine Google Actions device type from Galdys device.
 * @param {object} device - Gladys device.
 * @returns {object} GoogleActions device type and traits.
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
      if (traits.indexOf(matchingTrait.key) === -1) {
        traits.push(matchingTrait.key);
      }

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
