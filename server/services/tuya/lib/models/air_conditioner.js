const { mappings } = require('../dps/air_conditioner.standard');
const dpsMapping = require('../dps/air_conditioner.mapping');

const NAME = 'air_conditioner';
const CATEGORY = 'kt';
const PRODUCT_IDS = [];
const PRODUCT_KEYS = [];
const ALLOW_CATEGORY_FALLBACK = true;
const SUPPORTED_CODES = ['switch', 'mode', 'temp_set', 'temp_current'];

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
