const airtonAirConditioner = require('./airton_air_conditioner');
const airConditioner = require('./air_conditioner');
const switchModel = require('./switch');
const thermostat = require('./thermostat');
const powerMeter = require('./power_meter');

const normalizeCategoryList = (category) => (Array.isArray(category) ? category : [category]);
const normalizeProductList = (productIds) => (Array.isArray(productIds) ? productIds : [productIds]);

const models = [airtonAirConditioner, airConditioner, switchModel, thermostat, powerMeter];

const categoryToModel = models.reduce((acc, model) => {
  normalizeCategoryList(model.CATEGORY).forEach((category) => {
    acc[category] = model;
  });
  return acc;
}, {});

const productToModel = models.reduce((acc, model) => {
  normalizeProductList(model.PRODUCT_IDS || []).forEach((productId) => {
    acc[productId] = model;
  });
  normalizeProductList(model.PRODUCT_KEYS || []).forEach((productKey) => {
    acc[productKey] = model;
  });
  return acc;
}, {});

const getModelForDevice = (device) => {
  if (!device) {
    return null;
  }
  return productToModel[device.product_key] || productToModel[device.product_id] || categoryToModel[device.category];
};

const getMappingForDevice = (device, code) => {
  if (!device || !code) {
    return null;
  }
  const model = getModelForDevice(device);
  if (!model || !model.mappings) {
    return null;
  }
  if (Array.isArray(model.SUPPORTED_CODES) && !model.SUPPORTED_CODES.includes(code)) {
    return null;
  }
  return model.mappings[code] || null;
};

const getDpsMappingForDevice = (device) => {
  const model = getModelForDevice(device);
  if (!model || !model.dpsMapping || !model.dpsMapping.dps) {
    return null;
  }
  const filtered = Array.isArray(model.SUPPORTED_CODES)
    ? model.dpsMapping.dps.filter((entry) => model.SUPPORTED_CODES.includes(entry.code))
    : model.dpsMapping.dps;
  return {
    name: model.dpsMapping.name,
    dps: filtered,
  };
};

const getSupportForDevice = (device) => {
  if (!device) {
    return { supported: false, level: 'none', model: null };
  }
  const modelByProduct = productToModel[device.product_key] || productToModel[device.product_id];
  if (modelByProduct) {
    return { supported: true, level: 'product', model: modelByProduct.NAME || null };
  }
  const modelByCategory = categoryToModel[device.category];
  if (modelByCategory && modelByCategory.ALLOW_CATEGORY_FALLBACK) {
    return { supported: true, level: 'category', model: modelByCategory.NAME || null };
  }
  return { supported: false, level: 'none', model: modelByCategory ? modelByCategory.NAME || null : null };
};

module.exports = {
  getMappingForDevice,
  getDpsMappingForDevice,
  getSupportForDevice,
};
