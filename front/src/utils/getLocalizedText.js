// Get a localized text from a manifest multi-language object ({ en: '...', fr: '...' }).
// Falls back to English, then to the first available language. Shared by the
// external integration screens and the scene editor (integration-declared
// scene triggers and actions carry manifest labels too).
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
