const { mappings } = require('../dps/air_conditioner.standard');
const dpsMapping = require('../dps/air_conditioner.mapping');

const NAME = 'airton_air_conditioner';
const CATEGORY = 'kt';
const PRODUCT_IDS = ['f3goccgfj6qino4c'];
const PRODUCT_KEYS = ['keyquxnsj75xc8se'];
const ALLOW_CATEGORY_FALLBACK = false;
const SUPPORTED_CODES = [
  'switch',
  'mode',
  'temp_set',
  'temp_current',
  'fan_speed_enum',
  'eco',
  'drying',
  'heat',
  'light',
  'sleep',
  'countdown_left',
  'temp_unit_convert',
  'health',
  'cleaning',
];

module.exports = {
  NAME,
  CATEGORY,
  PRODUCT_IDS,
  PRODUCT_KEYS,
  ALLOW_CATEGORY_FALLBACK,
  SUPPORTED_CODES,
  mappings,
  dpsMapping,
};
