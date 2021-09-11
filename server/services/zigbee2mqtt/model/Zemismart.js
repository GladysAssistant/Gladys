const { features } = require('../utils/features');

/**
 * Zemismart managed models.
 */
const Zemismart = {
  brand: 'Zemismart',
  models: {
    AM43: [features.door],
    'BCM500DS-TYZ': [features.door],
    'HGZB-DLC4-N15B': [features.brightness, features.color, features.color_temperature, features.light],
    'LXN56-SS27LX1.1': [features.switch],
    'LXZB-12A': [features.brightness, features.color, features.color_temperature, features.light],
    M2805EGBZTN: [features.door],
    M515EGB: [features.door],
    'ZM-CSW002-D_switch': [features.switch],
    'ZM-CSW032-D': [features.door],
    'ZM-L03E-Z': [features.switch],
    ZM25TQ: [features.door],
    'ZM79E-DT': [features.door],
    'ZW-EU-01': [features.switch],
    'ZW-EU-02': [features.switch],
  },
};

module.exports = {
  Zemismart,
};
