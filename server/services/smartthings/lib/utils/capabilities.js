const CAPABILITIES = require('../capability');

const CAPABILITY_BY_FEATURE_CATEGORY = {};
Object.values(CAPABILITIES).forEach((capability) => {
  capability.features.forEach((feature) => {
    const category = CAPABILITY_BY_FEATURE_CATEGORY[feature.category] || {};
    category[feature.type] = capability;
    CAPABILITY_BY_FEATURE_CATEGORY[feature.category] = category;
  });
});

const CAPABILITY_BY_ID = {};
Object.values(CAPABILITIES).forEach((item) => {
  CAPABILITY_BY_ID[item.capability.id] = item;
});

module.exports = {
  CAPABILITIES,
  CAPABILITY_BY_FEATURE_CATEGORY,
  CAPABILITY_BY_ID,
};
