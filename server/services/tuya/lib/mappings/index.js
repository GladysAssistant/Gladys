const globalCloud = require('./cloud/global');
const smartSocketCloud = require('./cloud/smart-socket');

const globalLocal = require('./local/global');
const smartSocketLocal = require('./local/smart-socket');

const DEVICE_TYPES = {
  SMART_SOCKET: 'smart-socket',
  UNKNOWN: 'unknown',
};

const SWITCH_CODES = new Set(['switch', 'switch_1', 'switch_2', 'power']);

const SMART_SOCKET = {
  DEVICE_TYPE_NAME: DEVICE_TYPES.SMART_SOCKET,
  CATEGORIES: new Set(['cz']),
  PRODUCT_IDS: new Set(['cya3zxfd38g4qp8d']),
  KEYWORDS: ['socket', 'plug', 'outlet', 'prise'],
  REQUIRED_CODES: SWITCH_CODES,
  CLOUD_MAPPINGS: smartSocketCloud,
  LOCAL_MAPPINGS: smartSocketLocal,
};

const LIST_DEVICE_TYPES = [SMART_SOCKET];

const normalizeCode = (code) => {
  if (!code) {
    return null;
  }
  return String(code)
    .trim()
    .toLowerCase();
};

const normalizeStringSet = (setLike) =>
  new Set(
    Array.from(setLike || [])
      .map((value) => normalizeCode(value))
      .filter((value) => Boolean(value)),
  );

const DEVICE_TYPE_INDEX = LIST_DEVICE_TYPES.reduce((acc, definition) => {
  const typeName = normalizeCode(definition && definition.DEVICE_TYPE_NAME);
  acc[typeName] = {
    ...definition,
    CATEGORIES: normalizeStringSet(definition.CATEGORIES),
    PRODUCT_IDS: normalizeStringSet(definition.PRODUCT_IDS),
    KEYWORDS: Array.isArray(definition.KEYWORDS)
      ? definition.KEYWORDS.map((keyword) => String(keyword).toLowerCase())
      : [],
    REQUIRED_CODES: normalizeStringSet(definition.REQUIRED_CODES),
  };
  return acc;
}, {});

const matchDeviceType = (typeDefinition, context) => {
  const { category, productId, modelName, codes } = context;
  if (category && typeDefinition.CATEGORIES.has(category)) {
    return true;
  }
  if (productId && typeDefinition.PRODUCT_IDS.has(productId)) {
    return true;
  }

  const requiredCodes = typeDefinition.REQUIRED_CODES;
  const keywords = typeDefinition.KEYWORDS;

  const hasRequiredCode = requiredCodes.size === 0 || Array.from(requiredCodes).some((code) => codes.has(code));
  if (!hasRequiredCode || !modelName || keywords.length === 0) {
    return false;
  }

  return keywords.some((keyword) => modelName.includes(keyword));
};

const getCloudMapping = (deviceType) => {
  if (!deviceType || deviceType === DEVICE_TYPES.UNKNOWN) {
    return { ...globalCloud };
  }
  const definition = DEVICE_TYPE_INDEX[normalizeCode(deviceType)];
  if (definition && definition.CLOUD_MAPPINGS) {
    return { ...definition.CLOUD_MAPPINGS };
  }
  return { ...globalCloud };
};

const getLocalMapping = (deviceType) => {
  const normalizeLocalMapping = (mapping) => {
    const current = mapping && typeof mapping === 'object' ? mapping : {};
    return {
      strict: current.strict === true,
      codeAliases: { ...(current.codeAliases || {}) },
      dps: { ...(current.dps || {}) },
      ignoredDps: Array.from(
        new Set((Array.isArray(current.ignoredDps) ? current.ignoredDps : []).map((value) => String(value))),
      ),
    };
  };

  if (!deviceType || deviceType === DEVICE_TYPES.UNKNOWN) {
    return normalizeLocalMapping(globalLocal);
  }
  const definition = DEVICE_TYPE_INDEX[normalizeCode(deviceType)];
  if (definition && definition.LOCAL_MAPPINGS) {
    return normalizeLocalMapping(definition.LOCAL_MAPPINGS);
  }
  return normalizeLocalMapping(globalLocal);
};

const extractCodesFromSpecifications = (specifications) => {
  const codes = new Set();
  if (!specifications || typeof specifications !== 'object') {
    return codes;
  }
  const functions = Array.isArray(specifications.functions) ? specifications.functions : [];
  const status = Array.isArray(specifications.status) ? specifications.status : [];
  const properties = Array.isArray(specifications.properties) ? specifications.properties : [];

  [...functions, ...status, ...properties].forEach((item) => {
    if (!item || !item.code) {
      return;
    }
    codes.add(normalizeCode(item.code));
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
    if (parts.length >= 2) {
      const code = normalizeCode(parts[parts.length - 1]);
      if (code) {
        codes.add(code);
      }
    }
  });

  return codes;
};

const extractCodesFromThingModel = (thingModel) => {
  const codes = new Set();
  const services = Array.isArray(thingModel && thingModel.services) ? thingModel.services : [];

  services.forEach((service) => {
    const properties = Array.isArray(service && service.properties) ? service.properties : [];
    properties.forEach((property) => {
      if (!property || !property.code) {
        return;
      }
      codes.add(normalizeCode(property.code));
    });
  });

  return codes;
};

const extractCodesFromProperties = (propertiesPayload) => {
  const codes = new Set();
  let properties = [];
  if (Array.isArray(propertiesPayload)) {
    properties = propertiesPayload;
  } else if (Array.isArray(propertiesPayload && propertiesPayload.properties)) {
    properties = propertiesPayload.properties;
  }

  properties.forEach((property) => {
    if (!property || !property.code) {
      return;
    }
    codes.add(normalizeCode(property.code));
  });

  return codes;
};

const getDeviceType = (device) => {
  if (!device || typeof device !== 'object') {
    return DEVICE_TYPES.UNKNOWN;
  }

  const specifications = device.specifications || {};
  const codes = new Set([
    ...extractCodesFromSpecifications(specifications),
    ...extractCodesFromThingModel(device.thing_model),
    ...extractCodesFromProperties(device.properties),
    ...extractCodesFromFeatures(device.features),
  ]);

  const modelName = [device.model, device.product_name, device.name]
    .filter((value) => typeof value === 'string' && value.length > 0)
    .join(' ')
    .toLowerCase();
  const category = normalizeCode(specifications.category || device.category);
  const productId = normalizeCode(device.product_id);
  const context = {
    codes,
    modelName,
    category,
    productId,
  };

  const matchedType = Object.values(DEVICE_TYPE_INDEX).find((typeDefinition) =>
    matchDeviceType(typeDefinition, context),
  );
  if (matchedType && matchedType.DEVICE_TYPE_NAME) {
    return matchedType.DEVICE_TYPE_NAME;
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
  const mapping = getCloudMapping(deviceType);
  const ignored = Array.isArray(mapping.ignoredCodes) ? mapping.ignoredCodes : [];
  const normalized = ignored
    .filter((value) => value !== null && value !== undefined)
    .map((value) => String(value).toLowerCase());

  return Array.from(new Set(normalized));
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
