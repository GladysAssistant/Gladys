const { Error422 } = require('../../utils/httpErrors');
const { validateConfigValue } = require('./externalIntegration.validateConfigValue');
const { getDynamicOptions } = require('./externalIntegration.getDynamicOptions');
const { MAX_WIDGET_SETTINGS, MAX_WIDGET_SETTING_STRING_LENGTH, MAX_WIDGET_SETTINGS_BYTES } = require('./constants');

/**
 * @description Serialize a value as canonical JSON: keys sorted
 * lexicographically at every depth, arrays kept in order, no whitespace. Two
 * settings objects that differ only by key order share one cache entry.
 * @param {any} value - The value to serialize.
 * @returns {string} The canonical JSON.
 * @example
 * canonicalJson({ b: 1, a: [2, { d: 3, c: 4 }] }); // '{"a":[2,{"c":4,"d":3}],"b":1}'
 */
function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(',')}]`;
  }
  if (value !== null && typeof value === 'object') {
    const keys = Object.keys(value).sort();
    return `{${keys.map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

/**
 * @description Find a widget declared in the manifest of an integration.
 * @param {object} service - The external integration service.
 * @param {string} widgetKey - The widget key.
 * @returns {object|null} The declared widget, or null.
 * @example
 * const widget = findDeclaredWidget(service, 'upcoming_releases');
 */
function findDeclaredWidget(service, widgetKey) {
  const widgets = (service.manifest && service.manifest.widgets) || [];
  return widgets.find((widget) => widget.key === widgetKey) || null;
}

/**
 * @description Check the size bounds of the settings of one widget instance
 * before anything is looked up: at most 10 keys, string values of at most
 * 100 characters, at most 1 KB serialized (they travel URL-encoded in the
 * query string of the content route).
 * @param {object} settings - The raw settings object.
 * @example
 * checkSettingsBounds({ period_days: '30' });
 */
function checkSettingsBounds(settings) {
  const keys = Object.keys(settings);
  if (keys.length > MAX_WIDGET_SETTINGS) {
    throw new Error422(`settings: at most ${MAX_WIDGET_SETTINGS} keys`);
  }
  keys.forEach((key) => {
    const value = settings[key];
    const strings = Array.isArray(value) ? value : [value];
    strings.forEach((item) => {
      if (typeof item === 'string' && item.length > MAX_WIDGET_SETTING_STRING_LENGTH) {
        throw new Error422(`settings.${key}: must be at most ${MAX_WIDGET_SETTING_STRING_LENGTH} characters`);
      }
    });
  });
  if (Buffer.byteLength(JSON.stringify(settings), 'utf8') > MAX_WIDGET_SETTINGS_BYTES) {
    throw new Error422(`settings: must be at most ${MAX_WIDGET_SETTINGS_BYTES} bytes serialized`);
  }
}

/**
 * @description Validate the settings of one widget instance against the
 * `settings` declared by the widget, with the shared config_schema engine:
 * defaults applied to missing keys, `source: "devices"` resolved against the
 * integration's own devices, unknown key or invalid value → 422 naming the
 * key. Render-time validation is the one that must exist: a manifest can
 * change under a saved box on every integration update.
 * @param {object} service - The external integration service.
 * @param {object} widget - The declared widget.
 * @param {object} [rawSettings] - The settings of the box instance.
 * @returns {Promise<object>} The validated settings, defaults applied.
 * @example
 * const settings = await validateWidgetSettings(service, widget, { period_days: '30' });
 */
async function validateWidgetSettings(service, widget, rawSettings = {}) {
  if (rawSettings === null || typeof rawSettings !== 'object' || Array.isArray(rawSettings)) {
    throw new Error422('settings: must be an object');
  }
  checkSettingsBounds(rawSettings);
  // sections are presentational: no value, their key is never a setting
  const declaredFields = (widget.settings || []).filter((field) => field.type !== 'section');
  const dynamicOptions = await getDynamicOptions(service, declaredFields);
  const settings = {};
  Object.keys(rawSettings).forEach((key) => {
    const field = declaredFields.find((declaredField) => declaredField.key === key);
    if (!field) {
      throw new Error422(`settings.${key}: unknown setting`);
    }
    try {
      validateConfigValue(field, rawSettings[key], dynamicOptions);
    } catch (e) {
      // the shared engine names the config form (`config.<key>`); here it
      // is a setting — validateConfigValue only ever throws an Error422
      throw new Error422(`${e.properties}`.replace(/^config\./, 'settings.'));
    }
    settings[key] = rawSettings[key];
  });
  declaredFields.forEach((field) => {
    if (settings[field.key] === undefined && field.default !== undefined) {
      settings[field.key] = field.default;
    }
    if (field.required && settings[field.key] === undefined) {
      throw new Error422(`settings.${field.key}: required`);
    }
  });
  return settings;
}

module.exports = {
  validateWidgetSettings,
  findDeclaredWidget,
  canonicalJson,
};
