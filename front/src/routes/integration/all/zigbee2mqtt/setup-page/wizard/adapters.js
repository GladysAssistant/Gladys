// How the setup wizard shows the coordinator models and the USB ports, from GET /adapter (each model with its brand,
// commercial name, model code, photo and search aliases) and GET /usb/port.

export const LEGACY_EZSP_SUFFIX = ' (legacy ezsp)';
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
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');

const getSearchedTexts = adapter =>
  [adapter.label, adapter.displayName, adapter.modelCode, adapter.brand, ...(adapter.aliases || [])].filter(Boolean);

/**
 * @description The models matching a search: those whose model code or one of whose aliases it is ("skyconnect"), or,
 * for a search with a digit or a dash, whose model code starts or ends with it, or whose name ends with it ("dongle-p",
 * "slzb-06", "mg24"); else the whole search found in one of their names or aliases ("sonoff e"); or else each of its
 * words found in their names ("plus dongle").
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
  // A whole model code or alias typed, or the start or the end of a model code (with a digit or a dash in the search):
  // those models only ("dongle-p" is the ZBDongle-P, not the "Dongle Plus-E"; "zbt-1" the Connect ZBT-1 and the
  // SkyConnect)
  const codeLike = whole.length >= 4 && /[0-9-]/.test(search);
  const byCode = adapters.filter(adapter => {
    const code = adapter.modelCode ? normalize(adapter.modelCode) : '';
    const names = [adapter.displayName, adapter.label].map(normalize);
    return (
      code === whole ||
      (adapter.aliases || []).some(alias => normalize(alias) === whole) ||
      (codeLike &&
        ((code !== '' && (code.startsWith(whole) || code.endsWith(whole))) || names.some(name => name.endsWith(whole))))
    );
  });
  if (byCode.length > 0) {
    return byCode;
  }
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

// The drivers that can take over the network of each other: Silicon Labs (ember, its old ezsp), Texas Instruments,
// dresden elektronik. Another family forms a new network: the devices must be paired again.
const DRIVER_FAMILIES = { ember: 'silabs', ezsp: 'silabs', zstack: 'ti', deconz: 'deconz' };

export const isOtherDriverFamily = (currentDriver, nextDriver) =>
  Boolean(currentDriver && nextDriver) && DRIVER_FAMILIES[currentDriver] !== DRIVER_FAMILIES[nextDriver];

// A device plugged in a USB port, not a serial port of the machine itself (HAT, GPIO)
export const isPluggedPort = usbPort => Boolean(usbPort.pnpId);
