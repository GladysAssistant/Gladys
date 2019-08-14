const { features } = require('../utils/features');

/**
 * Philips managed models.
 */
const Philips = {
  brand: 'Philips',
  models: {
    '7299760PH': [features.switch, features.brightness], // color xy
    '7146060PH': [features.switch, features.brightness, features.color_temperature], // color xy
    '4090531P7': [features.switch, features.brightness, features.color_temperature], // color xy
    '433714': [features.switch, features.brightness],
    '8718696449691': [features.switch, features.brightness],
    '9290018195': [features.switch, features.brightness],
    '7299355PH': [features.switch, features.brightness], // color xy
    '915005106701': [features.switch, features.brightness, features.color_temperature], // color xy
    '9290012573A': [features.switch, features.brightness, features.color_temperature], // color xy
    '9290002579A': [features.switch, features.brightness, features.color_temperature], // color xy
    '8718696485880': [features.switch, features.brightness, features.color_temperature], // color xy
    '915005733701': [features.switch, features.brightness, features.color_temperature], // color xy
    '464800': [features.switch, features.brightness, features.color_temperature],
    '8718696695203': [features.switch, features.brightness, features.color_temperature],
    '8718696598283': [features.switch, features.brightness, features.color_temperature],
    '9290011998B': [features.switch, features.brightness, features.color_temperature],
    '8718696548738': [features.switch, features.brightness, features.color_temperature],
    '4090130P7': [features.switch, features.brightness, features.color_temperature], // color xy
    '3261030P7': [features.switch, features.brightness, features.color_temperature],
    '3261331P7': [features.switch, features.brightness, features.color_temperature],
    '4096730U7': [features.switch, features.brightness, features.color_temperature],
    '3216131P5': [features.switch, features.brightness, features.color_temperature],
    '3216331P5': [features.switch, features.brightness, features.color_temperature],
    '3216431P5': [features.switch, features.brightness, features.color_temperature],
    '4033930P7': [features.switch, features.brightness, features.color_temperature],
    '9290011370B': [features.switch, features.brightness],
    '046677476816': [features.switch, features.brightness],
    '7199960PH': [features.switch, features.brightness], // color xy
    '324131092621': [features.switch_sensor],
    '9290012607': [features.temperature, features.presence, features.illuminance],
    '9290019758': [features.temperature, features.presence, features.illuminance],
    '7099860PH': [features.switch, features.brightness], // color xy
    '3216231P5': [features.switch, features.brightness, features.color_temperature],
    '8718696170625': [features.switch, features.brightness],
  },
};

module.exports = {
  Philips,
};
