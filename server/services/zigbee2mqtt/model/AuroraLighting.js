const { features } = require('../utils/features');

/**
 * Aurora Lighting managed models.
 */
const AuroraLighting = {
  brand: 'Aurora Lighting',
  models: {
    'AU-A1GSZ9RGBW_HV-GSCXZB269K': [features.brightness, features.color, features.color_temperature, features.light],
    'AU-A1GUZB5/30': [features.brightness, features.light],
    'AU-A1GUZBCX5': [features.brightness, features.color_temperature, features.light],
    'AU-A1GUZBRGBW': [features.brightness, features.color, features.color_temperature, features.light],
    'AU-A1VG125Z5E/19': [features.brightness, features.light],
    'AU-A1VGSZ5E/19': [features.brightness, features.light],
    'AU-A1ZB2WDM': [features.brightness, features.light],
    'AU-A1ZBDSS': [features.power, features.switch],
    'AU-A1ZBDWS': [features.door],
    'AU-A1ZBPIA': [features.current, features.energy, features.power, features.switch, features.voltage],
    'AU-A1ZBPIAB': [features.current, features.power, features.switch, features.voltage],
    'AU-A1ZBPIRS': [features.illuminance, features.motion],
    'AU-A1ZBR1GW': [features.button],
    'AU-A1ZBR2GW': [features.button],
    'AU-A1ZBRC': [features.button],
  },
};

module.exports = {
  AuroraLighting,
};
