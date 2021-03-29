const { features } = require('../utils/features');

/**
 * Yale managed models.
 */
const Yale = {
  brand: 'Yale',
  models: {
    YRD426NRSC: [features.door],
    YRD226HA2619: [features.door],
    YRD256HA20BP: [features.door],
    YMF40: [features.door],
  },
};

module.exports = {
  Yale,
};
