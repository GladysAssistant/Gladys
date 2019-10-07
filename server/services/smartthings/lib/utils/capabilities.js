const CAPABILITIES = require('../capability');

const CAPABILITY_BY_FEATURE_CATEGORY = {};
Object.values(CAPABILITIES).forEach((capability) => {
  capability.features.forEach((feature) => {
    const category = CAPABILITY_BY_FEATURE_CATEGORY[feature.category] || {};
    category[feature.type] = capability;
    CAPABILITY_BY_FEATURE_CATEGORY[feature.category] = category;
  });
});

module.exports = {
  CAPABILITIES,
  CAPABILITY_BY_FEATURE_CATEGORY,
};
