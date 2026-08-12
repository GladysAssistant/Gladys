/**
 * Resolve the list of options to display for a device feature.
 *
 * When the feature declares supported_options (see Gladys core #2567: integrations fill the
 * t_device_feature_supported_option table at device creation/update), those drive the list:
 * they are ordered by their sort_order and keep their label as a fallback, while the matching
 * static option still provides the i18n key so the UI stays translated. When the feature has
 * no supported_options, the full static list is returned unchanged.
 *
 * @param {Object} deviceFeature - The device feature (with its supported_options, when any).
 * @param {Array<{ value: number, i18nKey: string }>} staticOptions - The full option catalog.
 * @returns {Array<{ value: number, i18nKey: (string|undefined), label: (string|undefined) }>} Options to display.
 * @example
 * const options = resolveFeatureOptions(deviceFeature, MODE_OPTIONS);
 */
function resolveFeatureOptions(deviceFeature, staticOptions) {
  const supportedOptions =
    deviceFeature && Array.isArray(deviceFeature.supported_options) ? deviceFeature.supported_options : null;

  if (!supportedOptions || supportedOptions.length === 0) {
    return staticOptions.map(option => ({ value: option.value, i18nKey: option.i18nKey }));
  }

  const i18nKeyByValue = new Map(staticOptions.map(option => [option.value, option.i18nKey]));
  return [...supportedOptions]
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map(option => ({ value: option.value, i18nKey: i18nKeyByValue.get(option.value), label: option.label }));
}

export { resolveFeatureOptions };
