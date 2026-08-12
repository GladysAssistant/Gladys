const {
  DEVICE_FEATURE_UNITS,
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES
} = require('../../server/utils/constants');
const fs = require('fs');
const path = require('path');
const i18n = require('../src/config/i18n/en.json');
const iconList = require('../../server/config/icons.json');
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

// Check scene icon labels and search keywords. Every icon needs a label in
// every language: it is displayed under the icon in the picker, and an icon
// without one would be unreachable through the search box in that language.
// Entries for icons that no longer exist are reported too, so the files cannot
// silently drift from icons.json.
['en', 'fr', 'de'].forEach(language => {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const icons = require(`../src/config/i18n/icon-keywords/${language}.json`);

  iconList.forEach(icon => {
    if (!get(icons, `${icon}.label`)) {
      missingKeys.push(`icon label ${icon} ==> icon-keywords/${language}.json`);
    }
  });

  Object.keys(icons).forEach(icon => {
    if (!iconList.includes(icon)) {
      missingKeys.push(`unknown icon "${icon}" in icon-keywords/${language}.json ==> not in server/config/icons.json`);
    }
  });
});

// The theme keeps Lucide's renamed aliases next to the original Feather names
// so existing markup keeps working: `house` and `home`, `circle-alert` and
// `alert-circle`, `tool` and `wrench`… They point at the same glyph, so
// offering both in the picker shows two identical tiles the user cannot tell
// apart. Only one name per glyph may appear in icons.json.
const themeCssPath = path.join(__dirname, '..', 'node_modules', '@gladysassistant', 'theme-optimized', 'dashboard.css');
const themeCss = fs.readFileSync(themeCssPath, 'utf8');
const codepoints = new Map();
const iconRule = /\.fe-([a-z0-9-]+):before \{\s*content: "\\([0-9a-f]+)";/g;
let match = iconRule.exec(themeCss);
while (match !== null) {
  codepoints.set(match[1], match[2]);
  match = iconRule.exec(themeCss);
}

const iconsByCodepoint = new Map();
iconList.forEach(icon => {
  const codepoint = codepoints.get(icon);
  if (!codepoint) {
    missingKeys.push(`icon ${icon} ==> no .fe-${icon} rule in the installed theme, it would render as a blank box`);
    return;
  }
  const twin = iconsByCodepoint.get(codepoint);
  if (twin) {
    missingKeys.push(`icon ${icon} ==> same glyph (\\${codepoint}) as "${twin}", keep only one of the two`);
  } else {
    iconsByCodepoint.set(codepoint, icon);
  }
});

if (missingKeys.length > 0) {
  console.error(
    `\x1b[31m\u001B[1m${missingKeys.length} translations are missing:`,
    missingKeys.map(key => `\n  - ${key}`).join(''),
    '\u001B[22m\x1b[0m'
  );
  throw new Error(`${missingKeys.length} translations are missing, please check upper list.`);
}
