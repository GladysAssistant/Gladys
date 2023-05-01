const { TRAITS } = require('../traits');

const exploreTrait = (trait, feature) => {
  let matchingTrait;
  let i = 0;

  while (trait.features[i] && !matchingTrait) {
    const traitFeature = trait.features[i];
    const { category, type } = traitFeature;

    if (category === feature.category && type === feature.type) {
      matchingTrait = trait;
    }

    i += 1;
  }

  return matchingTrait;
};

/**
 * @description Determine Google Actions device type from Galdys device.
 * @param {object} feature - Gladys device feature.
 * @returns {object} GoogleActions device type and traits.
 * @example
 * determineTypeAndTraits(device);
 */
function determineTrait(feature) {
  // Matching feature trait
  let matchingTrait;
  let i = 0;
  while (TRAITS[i] && !matchingTrait) {
    const trait = TRAITS[i];
    matchingTrait = exploreTrait(trait, feature);
    i += 1;
  }

  return matchingTrait;
}

module.exports = {
  determineTrait,
};
