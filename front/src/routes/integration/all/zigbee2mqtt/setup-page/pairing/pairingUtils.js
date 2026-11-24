import get from 'get-value';

import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../../../server/utils/constants';
import { getDeviceIcon } from '../../../../../../components/integration/mobile/utils';

// docs/specs/zigbee2mqtt-pairing.md

const PHOTO_URL = 'https://www.zigbee2mqtt.io/images/devices';

// What a device has besides what it is: never its name
const SECONDARY_CATEGORIES = [
  DEVICE_FEATURE_CATEGORIES.BATTERY,
  DEVICE_FEATURE_CATEGORIES.BATTERY_LOW,
  DEVICE_FEATURE_CATEGORIES.SIGNAL,
  DEVICE_FEATURE_CATEGORIES.DEVICE_TEMPERATURE_SENSOR
];

export const PAIRING_STATUS = {
  JOINED: 'joined',
  INTERVIEWING: 'interviewing',
  READY: 'ready',
  UNSUPPORTED: 'unsupported',
  FAILED: 'failed',
  LEFT: 'left'
};

/**
 * @description The photo of a device model on zigbee2mqtt.io (D.3), as the Zigbee2mqtt interface builds it.
 * @param {string} model - The model, as Zigbee2mqtt tells it.
 * @returns {string|null} The URL, null without a model.
 * @example
 * getDevicePhotoUrl('LED1545G12'); // 'https://www.zigbee2mqtt.io/images/devices/LED1545G12.png'
 */
export const getDevicePhotoUrl = model => (model ? `${PHOTO_URL}/${model.replace(/[:\s/]/g, '-')}.png` : null);

/**
 * @description The icon of a device category, from what the device is (a sensor), not from its battery that may come
 * first: the same feature as the suggested name (D.4).
 * @param {object} device - The Gladys device, with its features.
 * @returns {string} The name of the icon.
 * @example
 * getPairingIcon({ features: [{ category: 'battery', type: 'integer' }, { category: 'light', type: 'binary' }] });
 */
export const getPairingIcon = device => {
  const features = (device && device.features) || [];
  const isSecondary = feature => SECONDARY_CATEGORIES.includes(feature.category);
  return getDeviceIcon({
    features: [...features.filter(feature => !isSecondary(feature)), ...features.filter(isSecondary)]
  });
};

/**
 * @description The name Gladys suggests for a device that joined (D.4): "<category> <vendor>", suffixed when taken.
 * @param {object} device - The Gladys device, with its features.
 * @param {object} entry - The entry of the pairing registry (vendor, model).
 * @param {object} dictionary - The dictionary of the language of the user.
 * @param {Array<string>} takenNames - The names already used.
 * @returns {string} The name.
 * @example
 * suggestName({ features: [{ category: 'light' }] }, { vendor: 'IKEA' }, dictionary, []); // 'Lumière IKEA'
 */
export const suggestName = (device, entry, dictionary, takenNames) => {
  const features = (device && device.features) || [];
  const main = features.find(feature => !SECONDARY_CATEGORIES.includes(feature.category));
  const category = main && get(dictionary, `deviceFeatureCategory.${main.category}.shortCategoryName`);
  const parts = category ? [category, entry.vendor] : [entry.vendor, entry.model];
  const base = parts.filter(Boolean).join(' ') || entry.friendly_name;
  const taken = takenNames.map(name => name.toLowerCase());
  let name = base;
  let suffix = 2;
  while (taken.includes(name.toLowerCase())) {
    name = `${base} ${suffix}`;
    suffix += 1;
  }
  return name;
};

/**
 * @description A countdown as "3:52".
 * @param {number} seconds - The seconds left.
 * @returns {string} Minutes and seconds.
 * @example
 * formatCountdown(232); // '3:52'
 */
export const formatCountdown = seconds => {
  const safe = Math.max(0, Math.round(seconds));
  return `${Math.floor(safe / 60)}:${String(safe % 60).padStart(2, '0')}`;
};
