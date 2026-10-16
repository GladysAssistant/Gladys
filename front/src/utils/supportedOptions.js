import { getLocalizedText } from './getLocalizedText';

/**
 * The label of a supported option in the user's language. An integration can publish a label
 * in several languages ({ en, fr?, de?, es? }): the core keeps them in label_translations and
 * stores their English text in label, which stays the fallback (plain string labels, and
 * devices saved before translations existed).
 *
 * @param {Object} option - A supported option ({ value, label, label_translations }).
 * @param {string} [language] - The user's language (user.language).
 * @returns {(string|undefined)} The label to display.
 * @example
 * getOptionLabel({ value: 'healthy', label: 'Healthy', label_translations: { en: 'Healthy', fr: 'Sain' } }, 'fr');
 */
function getOptionLabel(option, language) {
  if (!option) {
    return undefined;
  }
  return getLocalizedText(option.label_translations, language) || option.label;
}

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
 * @param {string} [language] - The user's language, to pick the translated label of an option.
 * @returns {Array<{ value: number, i18nKey: (string|undefined), label: (string|undefined) }>} Options to display.
 * @example
 * const options = resolveFeatureOptions(deviceFeature, MODE_OPTIONS, user.language);
 */
function resolveFeatureOptions(deviceFeature, staticOptions, language) {
  const supportedOptions =
    deviceFeature && Array.isArray(deviceFeature.supported_options) ? deviceFeature.supported_options : null;

  if (!supportedOptions || supportedOptions.length === 0) {
    return staticOptions.map(option => ({ value: option.value, i18nKey: option.i18nKey }));
  }

  const i18nKeyByValue = new Map(staticOptions.map(option => [option.value, option.i18nKey]));
  return [...supportedOptions]
    .sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0))
    .map(option => ({
      value: option.value,
      i18nKey: i18nKeyByValue.get(option.value),
      label: getOptionLabel(option, language)
    }));
}

export { getOptionLabel, resolveFeatureOptions };
