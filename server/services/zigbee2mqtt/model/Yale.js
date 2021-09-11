const { features } = require('../utils/features');

/**
 * Yale managed models.
 */
const Yale = {
  brand: 'Yale',
  models: {
    'YDD-D4F0-TSDB': [features.door],
    'YMF40/YDM4109+': [features.door],
    'YRD210-HA-605': [features.door],
    'YRD216-HA2-619': [features.door],
    'YRD220/YRD221': [features.door],
    'YRD226/246 TSDB': [features.door],
    YRD226HA2619: [features.door],
    YRD246HA20BP: [features.door],
    YRD256HA20BP: [features.door],
    YRD426NRSC: [features.door],
    'YRL-220L': [features.door],
    'YRL226L TS': [features.door],
  },
};

module.exports = {
  Yale,
};
