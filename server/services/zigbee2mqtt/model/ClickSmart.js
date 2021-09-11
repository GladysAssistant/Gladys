const { features } = require('../utils/features');

/**
 * ClickSmart+ managed models.
 */
const ClickSmart = {
  brand: 'ClickSmart+',
  models: {
    CMA30035: [features.switch_sensor],
    CMA30036: [features.switch_sensor],
  },
};

module.exports = {
  ClickSmart,
};
