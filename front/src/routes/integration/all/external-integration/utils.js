// Get a localized text from a manifest multi-language object ({ en: '...', fr: '...' }).
// Falls back to English, then to the first available language.
export const getLocalizedText = (value, language) => {
  if (!value) {
    return '';
  }
  if (typeof value === 'string') {
    return value;
  }
  if (value[language]) {
    return value[language];
  }
  if (value.en) {
    return value.en;
  }
  const firstLanguage = Object.keys(value)[0];
  return firstLanguage ? value[firstLanguage] : '';
};

// Badge color for each external integration status
export const EXTERNAL_INTEGRATION_STATUS_BADGES = {
  UNKNOWN: 'badge-secondary',
  ENABLED: 'badge-info',
  DISABLED: 'badge-secondary',
  LOADING: 'badge-info',
  RUNNING: 'badge-success',
  DEGRADED: 'badge-warning',
  STOPPED: 'badge-secondary',
  ERROR: 'badge-danger'
};

export const getGithubRepoUrl = storeSlug => (storeSlug ? `https://github.com/${storeSlug}` : null);

// Union of the hardware classes requested by the sub-container declarations
// of a manifest, in declaration order.
export const getRequestedHardwareClasses = containers => {
  const requestedClasses = [];
  (containers || []).forEach(container => {
    (container.devices || []).forEach(hardwareClass => {
      if (!requestedClasses.includes(hardwareClass)) {
        requestedClasses.push(hardwareClass);
      }
    });
  });
  return requestedClasses;
};

// Effective transport of a device, reported by the integration through the
// reserved GLADYS_TRANSPORT param (local | cloud | unreachable), or null.
export const getDeviceTransport = device => {
  const transportParam = ((device && device.params) || []).find(param => param.name === 'GLADYS_TRANSPORT');
  return transportParam ? transportParam.value : null;
};

// Degraded transport state, orthogonal to the transport value ("which
// channel is used" vs "is it the nominal state"): the device works, but
// not in its nominal mode — e.g. local detected but sessions refused,
// falling back to cloud. Rendered as an orange dot on the transport badge.
export const isDeviceTransportDegraded = device => {
  const degradedParam = ((device && device.params) || []).find(param => param.name === 'GLADYS_TRANSPORT_DEGRADED');
  return degradedParam ? degradedParam.value === 'true' : false;
};

// The reason of the degraded state (GLADYS_TRANSPORT_MESSAGE, a
// multi-language object serialized as JSON), localized, or null.
export const getDeviceTransportMessage = (device, language) => {
  const messageParam = ((device && device.params) || []).find(param => param.name === 'GLADYS_TRANSPORT_MESSAGE');
  if (!messageParam) {
    return null;
  }
  try {
    return getLocalizedText(JSON.parse(messageParam.value), language) || null;
  } catch (e) {
    return null;
  }
};
