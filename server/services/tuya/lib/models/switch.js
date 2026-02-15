const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');

const NAME = 'switch';
const CATEGORY = ['cz', 'kg'];
const PRODUCT_IDS = ['keyaqceqmgp343e7', 'cya3zxfd38g4qp8d'];
const ALLOW_CATEGORY_FALLBACK = true;

const mappings = {
  switch: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  },
  switch_1: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  },
  switch_2: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  },
  switch_3: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  },
  switch_4: {
    category: DEVICE_FEATURE_CATEGORIES.SWITCH,
    type: DEVICE_FEATURE_TYPES.SWITCH.BINARY,
  },
};

module.exports = {
  NAME,
  CATEGORY,
  PRODUCT_IDS,
  ALLOW_CATEGORY_FALLBACK,
  mappings,
};
