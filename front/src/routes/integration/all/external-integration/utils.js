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
