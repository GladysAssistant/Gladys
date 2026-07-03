/**
 * Values a device feature actually supports, from its supported_options (see Gladys core #2567:
 * integrations fill the t_device_feature_supported_option table at device creation/update).
 * Returns null when the feature declares no restriction, so callers keep their full option list.
 * @param {Object} deviceFeature - The device feature (with its supported_options, when any).
 * @returns {Array<number>|null} The supported values, or null when unrestricted.
 * @example
 * const supportedValues = getSupportedOptionValues(deviceFeature);
 * const options = ALL_OPTIONS.filter(o => supportedValues === null || supportedValues.includes(o.value));
 */
function getSupportedOptionValues(deviceFeature) {
  if (
    !deviceFeature ||
    !Array.isArray(deviceFeature.supported_options) ||
    deviceFeature.supported_options.length === 0
  ) {
    return null;
  }
  return deviceFeature.supported_options.map(option => option.value);
}

export { getSupportedOptionValues };
