const globalCloud = require('./cloud/global');
const airConditionerCloud = require('./cloud/air-conditioner');
const smartSocketCloud = require('./cloud/smart-socket');

const globalLocal = require('./local/global');
const airConditionerLocal = require('./local/air-conditioner');
const smartSocketLocal = require('./local/smart-socket');

const DEVICE_TYPES = {
  AIR_CONDITIONER: 'air-conditioner',
  SMART_SOCKET: 'smart-socket',
  UNKNOWN: 'unknown',
};

const CLOUD_MAPPINGS = {
  [DEVICE_TYPES.AIR_CONDITIONER]: airConditionerCloud,
  [DEVICE_TYPES.SMART_SOCKET]: smartSocketCloud,
};

const LOCAL_MAPPINGS = {
  [DEVICE_TYPES.AIR_CONDITIONER]: airConditionerLocal,
  [DEVICE_TYPES.SMART_SOCKET]: smartSocketLocal,
};

const normalizeCode = (code) => {
  if (!code) {
    return null;
  }
  return String(code).toLowerCase();
};

const getCloudMapping = (deviceType) => {
  const overrides = (deviceType && CLOUD_MAPPINGS[deviceType]) || {};
  return { ...globalCloud, ...overrides };
};

const getLocalMapping = (deviceType) => {
  const overrides = (deviceType && LOCAL_MAPPINGS[deviceType]) || {};
  const ignoredDps = [
    ...(Array.isArray(globalLocal.ignoredDps) ? globalLocal.ignoredDps : []),
    ...(Array.isArray(overrides.ignoredDps) ? overrides.ignoredDps : []),
  ];
  return {
    strict: overrides.strict === true,
    codeAliases: { ...(globalLocal.codeAliases || {}), ...(overrides.codeAliases || {}) },
    dps: { ...(globalLocal.dps || {}), ...(overrides.dps || {}) },
    ignoredDps: Array.from(new Set(ignoredDps.map((value) => String(value)))),
  };
};

const extractCodesFromSpecifications = (specifications) => {
  const codes = new Set();
  if (!specifications || typeof specifications !== 'object') {
    return codes;
  }
  const functions = Array.isArray(specifications.functions) ? specifications.functions : [];
  const status = Array.isArray(specifications.status) ? specifications.status : [];
  [...functions, ...status].forEach((item) => {
    if (!item || !item.code) {
      return;
    }
    codes.add(String(item.code).toLowerCase());
  });
  return codes;
};

const extractCodesFromFeatures = (features) => {
  const codes = new Set();
  if (!Array.isArray(features)) {
    return codes;
  }
  features.forEach((feature) => {
    if (!feature || !feature.external_id) {
      return;
    }
    const parts = String(feature.external_id).split(':');
    if (parts.length >= 3) {
      const code = parts[2];
      if (code) {
        codes.add(String(code).toLowerCase());
      }
    }
  });
  return codes;
};

const isAirConditioner = (codes, modelName) => {
  if (!codes || !(codes instanceof Set)) {
    return false;
  }
  const hasTempSet = codes.has('temp_set');
  const hasMode = codes.has('mode');
  const hasFan = codes.has('fan_speed_enum') || codes.has('windspeed');
  if (hasTempSet && hasMode && hasFan) {
    return true;
  }
  return Boolean(modelName && modelName.includes('air conditioner'));
};

const SMART_SOCKET_CATEGORIES = new Set(['cz']);
const SMART_SOCKET_KEYWORDS = ['socket', 'plug', 'outlet', 'prise'];

const isSmartSocket = (codes, modelName, category) => {
  if (category && SMART_SOCKET_CATEGORIES.has(category)) {
    return true;
  }
  if (!codes || !(codes instanceof Set)) {
    return false;
  }
  const hasSwitch = codes.has('switch') || codes.has('switch_1') || codes.has('switch_2');
  if (!hasSwitch) {
    return false;
  }
  if (!modelName) {
    return false;
  }
  return SMART_SOCKET_KEYWORDS.some((keyword) => modelName.includes(keyword));
};

const getDeviceType = (device) => {
  if (!device || typeof device !== 'object') {
    return DEVICE_TYPES.UNKNOWN;
  }
  const specifications = device.specifications || {};
  let codes = extractCodesFromSpecifications(specifications);
  if (codes.size === 0) {
    codes = extractCodesFromFeatures(device.features);
  }
  const modelName = [device.model, device.product_name, device.name]
    .filter((value) => typeof value === 'string' && value.length > 0)
    .join(' ')
    .toLowerCase();
  const category = normalizeCode(specifications.category || device.category);

  if (isAirConditioner(codes, modelName)) {
    return DEVICE_TYPES.AIR_CONDITIONER;
  }
  if (isSmartSocket(codes, modelName, category)) {
    return DEVICE_TYPES.SMART_SOCKET;
  }
  return DEVICE_TYPES.UNKNOWN;
};

const getFeatureMapping = (code, deviceType) => {
  const normalized = normalizeCode(code);
  if (!normalized) {
    return null;
  }
  const mapping = getCloudMapping(deviceType);
  const candidate = mapping[normalized];
  if (!candidate || typeof candidate !== 'object') {
    return null;
  }
  if (!candidate.category || !candidate.type) {
    return null;
  }
  return candidate;
};

const getIgnoredLocalDps = (deviceType) => {
  const { ignoredDps } = getLocalMapping(deviceType);
  return Array.isArray(ignoredDps) ? ignoredDps : [];
};

const getIgnoredCloudCodes = (deviceType) => {
  const globalIgnored = Array.isArray(globalCloud.ignoredCodes) ? globalCloud.ignoredCodes : [];
  const overrides = (deviceType && CLOUD_MAPPINGS[deviceType]) || {};
  const overrideIgnored = Array.isArray(overrides.ignoredCodes) ? overrides.ignoredCodes : [];
  const merged = [...globalIgnored, ...overrideIgnored]
    .filter((value) => value !== null && value !== undefined)
    .map((value) => String(value).toLowerCase());
  return Array.from(new Set(merged));
};

module.exports = {
  DEVICE_TYPES,
  extractCodesFromSpecifications,
  extractCodesFromFeatures,
  getCloudMapping,
  getLocalMapping,
  getFeatureMapping,
  getIgnoredLocalDps,
  getIgnoredCloudCodes,
  getDeviceType,
  normalizeCode,
};
