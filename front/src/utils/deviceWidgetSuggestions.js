import { DEVICE_FEATURE_CATEGORIES } from '../../../server/utils/constants';

// What a device reports about itself rather than about the house: not what a user puts on a
// dashboard first
const SECONDARY_CATEGORIES = [
  DEVICE_FEATURE_CATEGORIES.BATTERY,
  DEVICE_FEATURE_CATEGORIES.BATTERY_LOW,
  DEVICE_FEATURE_CATEGORIES.SIGNAL,
  DEVICE_FEATURE_CATEGORIES.DEVICE_TEMPERATURE_SENSOR
];

// A device paired this recently is suggested: it is most likely the one being added
const RECENT_DEVICE_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_SUGGESTIONS = 8;

const getKind = feature => `${feature.category}:${feature.type}`;

/**
 * @description The features of a device worth showing on a dashboard: all of them but what the
 * device reports about itself (battery, signal, internal temperature) — unless that is all it has.
 * @param {object} device - The device, with its features.
 * @returns {Array} The features, in the device's order.
 * @example getMainFeatures(device);
 */
const getMainFeatures = device => {
  const features = (device && device.features) || [];
  const main = features.filter(feature => !SECONDARY_CATEGORIES.includes(feature.category));
  return main.length > 0 ? main : features;
};

/**
 * @description The suggestions of the picker of a devices widget
 * (docs/specs/dashboard-flexible-layout-and-widgets.md, A.3.1): what the widget most likely misses.
 * First the features of the same kind (category and type) as the ones it shows and that it does
 * not show yet — the bathroom temperature for a widget of temperatures —, then the main features
 * of the devices created in the last 7 days, the ones just paired. Selectors only: the picker
 * turns them into its own rows (a light is one row).
 * @param {Array} devices - Every device of the house, with its features.
 * @param {Array} widgetEntries - The features the widget shows: { device, feature }.
 * @param {number} now - The current time, in milliseconds (for tests).
 * @returns {Array} The suggested feature selectors, most relevant first.
 * @example getWidgetSuggestions(devices, [{ device, feature }]);
 */
const getWidgetSuggestions = (devices = [], widgetEntries = [], now = Date.now()) => {
  const shown = new Set(widgetEntries.map(entry => entry.feature.selector));
  const kinds = new Set(widgetEntries.map(entry => getKind(entry.feature)));
  const suggested = [];
  const add = selector => {
    if (!shown.has(selector) && !suggested.includes(selector)) {
      suggested.push(selector);
    }
  };
  if (kinds.size > 0) {
    devices.forEach(device =>
      (device.features || []).forEach(feature => {
        if (kinds.has(getKind(feature))) {
          add(feature.selector);
        }
      })
    );
  }
  devices
    .filter(device => device.created_at && now - new Date(device.created_at).getTime() < RECENT_DEVICE_MS)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .forEach(device => getMainFeatures(device).forEach(feature => add(feature.selector)));
  return suggested.slice(0, MAX_SUGGESTIONS * 3);
};

export { SECONDARY_CATEGORIES, MAX_SUGGESTIONS, getMainFeatures, getWidgetSuggestions };
