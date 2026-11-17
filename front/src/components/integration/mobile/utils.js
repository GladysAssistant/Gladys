import get from 'get-value';

import { DeviceFeatureCategoriesIcon } from '../../../utils/consts';

/**
 * @description The icon of a device in a phone list: the one of its first feature that has one.
 * @param {object} device - The device, with its features.
 * @returns {string} A Feather icon name.
 * @example
 * getDeviceIcon({ features: [{ category: 'light', type: 'binary' }] });
 */
const getDeviceIcon = device => {
  const features = (device && device.features) || [];
  for (let i = 0; i < features.length; i += 1) {
    const icon = get(DeviceFeatureCategoriesIcon, `${features[i].category}.${features[i].type}`);
    if (icon) {
      return icon;
    }
  }
  return 'box';
};

/**
 * @description The room of a device, as the line under its name: "Kitchen", or "No room".
 * @param {Array} houses - The houses with their rooms.
 * @param {object} device - The device.
 * @param {object} intl - The intl object (dictionary).
 * @returns {string} The label of the room.
 * @example
 * getRoomLabel(houses, device, intl);
 */
const getRoomLabel = (houses, device, intl) => {
  if (device.room_id) {
    const allHouses = houses || [];
    for (let i = 0; i < allHouses.length; i += 1) {
      const room = (allHouses[i].rooms || []).find(candidate => candidate.id === device.room_id);
      if (room) {
        return room.name;
      }
    }
    if (device.room && device.room.name) {
      return device.room.name;
    }
  }
  return get(intl.dictionary, 'device.noRoom');
};

/**
 * @description The tone of a battery pill: the thresholds of the desktop badge.
 * @param {number} level - The battery level in percent.
 * @returns {string} A tone of MobilePill.
 * @example
 * getBatteryTone(8); // 'danger'
 */
const getBatteryTone = level => {
  if (level < 10) {
    return 'danger';
  }
  if (level < 25) {
    return 'warning';
  }
  return 'success';
};

export { getDeviceIcon, getRoomLabel, getBatteryTone };
