const LOCAL_CODE_ALIASES = {
  switch: ['power'],
  power: ['switch']
};

export const normalizeBoolean = value =>
  value === true || value === 1 || value === '1' || value === 'true' || value === 'TRUE';

const getIgnoredLocalDps = device => {
  const mapping = device && device.tuya_mapping ? device.tuya_mapping : null;
  const ignored = mapping && Array.isArray(mapping.ignored_local_dps) ? mapping.ignored_local_dps : [];
  return new Set(ignored.map(value => String(value)));
};

const getIgnoredCloudCodes = device => {
  const mapping = device && device.tuya_mapping ? device.tuya_mapping : null;
  const ignored = mapping && Array.isArray(mapping.ignored_cloud_codes) ? mapping.ignored_cloud_codes : [];
  return new Set(ignored.map(value => String(value).toLowerCase()));
};

const getLocalDpsFromProperties = (code, properties) => {
  if (!code || !properties) {
    return null;
  }
  const list = Array.isArray(properties.properties) ? properties.properties : properties;
  if (!Array.isArray(list)) {
    return null;
  }
  const normalized = code.toLowerCase();
  const candidates = [normalized, ...(LOCAL_CODE_ALIASES[normalized] || [])];
  for (let i = 0; i < candidates.length; i += 1) {
    const candidate = candidates[i];
    const match = list.find(item => item && item.code && item.code.toLowerCase() === candidate);
    if (match && match.dp_id !== undefined && match.dp_id !== null) {
      return match.dp_id;
    }
  }
  return null;
};

const getLocalDpsFromCode = (code, device) => {
  if (!code) {
    return null;
  }
  const propertyMatch = getLocalDpsFromProperties(code, device && device.properties);
  if (propertyMatch !== null) {
    return propertyMatch;
  }
  const normalized = code.toLowerCase();
  if (normalized === 'switch' || normalized === 'power') {
    return 1;
  }
  const match = normalized.match(/_(\d+)$/);
  if (match) {
    return parseInt(match[1], 10);
  }
  return null;
};

const getKnownDpsKeys = (features, device) => {
  const keys = new Set();
  if (!Array.isArray(features)) {
    return keys;
  }
  features.forEach(feature => {
    const parts = (feature.external_id || '').split(':');
    const code = parts.length >= 3 ? parts[2] : null;
    const dpsKey = getLocalDpsFromCode(code, device);
    if (dpsKey !== null) {
      keys.add(String(dpsKey));
    }
  });
  return keys;
};

export const getUnknownDpsKeys = (localPollDps, features, device) => {
  if (!localPollDps || typeof localPollDps !== 'object') {
    return [];
  }
  const knownKeys = getKnownDpsKeys(features, device);
  const ignoredDps = getIgnoredLocalDps(device);
  return Object.keys(localPollDps).filter(key => !knownKeys.has(key) && !ignoredDps.has(String(key)));
};

export const getUnknownSpecificationCodes = (specifications, features, device) => {
  if (!specifications || (!Array.isArray(specifications.functions) && !Array.isArray(specifications.status))) {
    return [];
  }
  const knownCodes = new Set();
  const addKnownCode = code => {
    if (code !== null && code !== undefined) {
      knownCodes.add(
        String(code)
          .trim()
          .toLowerCase()
      );
    }
  };
  if (Array.isArray(features)) {
    features.forEach(feature => {
      const parts = (feature.external_id || '').split(':');
      const code = parts.length >= 2 ? parts[parts.length - 1] : null;
      addKnownCode(code);
    });
  }
  const services = Array.isArray(device && device.thing_model && device.thing_model.services)
    ? device.thing_model.services
    : [];
  services.forEach(service => {
    const properties = Array.isArray(service && service.properties) ? service.properties : [];
    properties.forEach(property => addKnownCode(property && property.code));
  });
  const propertiesPayload = device && device.properties;
  const properties = Array.isArray(propertiesPayload)
    ? propertiesPayload
    : Array.isArray(propertiesPayload && propertiesPayload.properties)
    ? propertiesPayload.properties
    : [];
  properties.forEach(property => addKnownCode(property && property.code));
  const specCodes = new Set();
  ['functions', 'status'].forEach(key => {
    const entries = specifications[key];
    if (!Array.isArray(entries)) {
      return;
    }
    entries.forEach(entry => {
      if (entry && entry.code) {
        specCodes.add(entry.code);
      }
    });
  });
  const ignoredCodes = getIgnoredCloudCodes(device);
  return Array.from(specCodes).filter(code => {
    const normalized = String(code)
      .trim()
      .toLowerCase();
    return !knownCodes.has(normalized) && !ignoredCodes.has(normalized);
  });
};

export const buildParamsMap = device =>
  (Array.isArray(device && device.params) ? device.params : []).reduce((acc, param) => {
    acc[param.name] = param.value;
    return acc;
  }, {});

export const getParamValue = (device, name) => {
  const params = Array.isArray(device && device.params) ? device.params : [];
  const found = params.find(param => param.name === name);
  return found ? found.value : undefined;
};

export const getLocalOverrideValue = device => {
  if (!device) {
    return undefined;
  }
  if (device.local_override !== undefined && device.local_override !== null) {
    return device.local_override;
  }
  return getParamValue(device, 'LOCAL_OVERRIDE');
};

export const getLocalPollDpsFromParams = device => {
  const raw = getParamValue(device, 'LOCAL_POLL_DPS');
  if (!raw) {
    return null;
  }
  if (typeof raw === 'object') {
    return raw;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
};

export const getProductIdentifier = device =>
  device.product_id ||
  getParamValue(device, 'PRODUCT_ID') ||
  device.product_key ||
  getParamValue(device, 'PRODUCT_KEY') ||
  'unknown-product';
