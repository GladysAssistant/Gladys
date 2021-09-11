const { features } = require('../utils/features');

/**
 * iCasa managed models.
 */
const ICasa = {
  brand: 'iCasa',
  models: {
    'ICZB-B1FC60/B3FC64/B2FC95/B2FC125': [features.brightness, features.color_temperature, features.light],
    'ICZB-DC11': [features.brightness, features.light],
    'ICZB-IW11D': [features.brightness, features.light],
    'ICZB-IW11SW': [features.switch_sensor],
    'ICZB-KPD12': [features.button],
    'ICZB-KPD14S': [features.button],
    'ICZB-KPD18S': [features.button],
    'ICZB-R11D': [features.brightness, features.light],
    'ICZB-R12D': [features.brightness, features.light],
    'ICZB-RM11S': [features.button],
  },
};

module.exports = {
  ICasa,
};
