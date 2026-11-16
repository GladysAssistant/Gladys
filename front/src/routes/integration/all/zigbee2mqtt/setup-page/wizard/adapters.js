// How the setup wizard shows the coordinator models and the USB ports, from GET /adapter (each model with its brand,
// commercial name, model code, photo and search aliases) and GET /usb/port.

const LEGACY_EZSP_SUFFIX = ' (legacy ezsp)';
const PHOTO_URL = 'https://www.zigbee2mqtt.io/images/devices';

export const isLegacyEzsp = adapter => adapter.label.endsWith(LEGACY_EZSP_SUFFIX);

export const getPhotoUrl = adapter => (adapter && adapter.image ? `${PHOTO_URL}/${adapter.image}.png` : null);

export const findAdapter = (adapters, label) => adapters.find(adapter => adapter.label === label) || null;

// A model shown without its brand, under the name of its brand
export const getNameInBrand = adapter =>
  adapter.brand && adapter.displayName.startsWith(`${adapter.brand} `)
    ? adapter.displayName.slice(adapter.brand.length + 1)
    : adapter.displayName;

// "dongle-e", "Dongle E" and "dongleE" are the same search
const normalize = text =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

const getSearchedTexts = adapter =>
  [adapter.label, adapter.displayName, adapter.modelCode, adapter.brand, ...(adapter.aliases || [])].filter(Boolean);

/**
 * @description The models matching a search: the whole search found in one of their names or aliases ("sonoff e"),
 * or else each of its words found in their names ("plus dongle").
 * @param {Array} adapters - Models.
 * @param {string} search - Searched text.
 * @returns {Array} The matching models.
 */
export const searchAdapters = (adapters, search) => {
  const words = search
    .split(/\s+/)
    .map(normalize)
    .filter(Boolean);
  if (words.length === 0) {
    return adapters;
  }
  const whole = words.join('');
  const byWhole = adapters.filter(adapter => getSearchedTexts(adapter).some(text => normalize(text).includes(whole)));
  if (byWhole.length > 0) {
    return byWhole;
  }
  return adapters.filter(adapter => {
    const searched = getSearchedTexts(adapter)
      .map(normalize)
      .join(' ');
    return words.every(word => searched.includes(word));
  });
};

/**
 * @description The models grouped by brand, the brands and the models of each in alphabetical order.
 * @param {Array} adapters - Models.
 * @returns {Array} `[{ brand, adapters }]`.
 */
export const groupByBrand = adapters => {
  const groups = {};
  adapters.forEach(adapter => {
    const brand = adapter.brand || '';
    groups[brand] = groups[brand] || [];
    groups[brand].push(adapter);
  });
  return Object.keys(groups)
    .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    .map(brand => ({
      brand,
      adapters: groups[brand].sort((a, b) => getNameInBrand(a).localeCompare(getNameInBrand(b)))
    }));
};

// The path to store for a port: its /dev/serial/by-id/ link when it has one, which follows the dongle to another port
export const getPortPath = usbPort => usbPort.stablePath || usbPort.path;

// The ports listed once (the same /dev/ttyUSB0 is listed twice on Synology systems)
export const dedupePorts = usbPorts => {
  const byPath = {};
  usbPorts.forEach(usbPort => {
    byPath[usbPort.path] = usbPort;
  });
  return Object.values(byPath);
};

// A device plugged in a USB port, not a serial port of the machine itself (HAT, GPIO)
export const isPluggedPort = usbPort => Boolean(usbPort.pnpId);
