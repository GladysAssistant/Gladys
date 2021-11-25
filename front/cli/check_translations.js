const {
  DEVICE_FEATURE_UNITS,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES
} = require('../../server/utils/constants');
const i18n = require('../src/config/i18n/en.json');
const get = require('get-value');

const missingKeys = [];

const checkTranslation = (i18nKey, dataType, dataKey) => {
  const value = get(i18n, i18nKey);

  if (!value) {
    missingKeys.push(`${dataType} ${dataKey} ==> ${i18nKey}`);
  }
};

// Check units
const unitParentKeys = ['deviceFeatureUnit', 'deviceFeatureUnitShort'];
unitParentKeys.forEach(parentKey => {
  Object.keys(DEVICE_FEATURE_UNITS).forEach(unitKey => {
    const unit = DEVICE_FEATURE_UNITS[unitKey];
    checkTranslation(`${parentKey}.${unit}`, 'unit', unitKey);
  });
});

// Check device categories / features
const featureParentKey = ['deviceFeatureCategory'];
featureParentKey.forEach(parentKey => {
  Object.keys(DEVICE_FEATURE_CATEGORIES).forEach(categoryKey => {
    const category = DEVICE_FEATURE_CATEGORIES[categoryKey];
    checkTranslation(`${parentKey}.${category}.shortCategoryName`, 'category', categoryKey);

    Object.keys(DEVICE_FEATURE_TYPES[categoryKey] || {}).forEach(featureKey => {
      const feature = DEVICE_FEATURE_TYPES[categoryKey][featureKey];
      checkTranslation(`${parentKey}.${category}.${feature}`, 'feature', `${categoryKey}.${featureKey}`);
    });
  });
});

if (missingKeys.length > 0) {
  console.error(
    `\x1b[31m\u001B[1m${missingKeys.length} translations are missing:`,
    missingKeys.map(key => `\n  - ${key}`).join(''),
    '\u001B[22m\x1b[0m'
  );
  throw new Error(`${missingKeys.length} translations are missing, please check upper list.`);
}
