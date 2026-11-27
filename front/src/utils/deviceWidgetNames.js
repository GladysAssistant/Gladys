import get from 'get-value';

import { getDeviceFeatureName, getDeviceFeatureDescription } from './device';
import { isLightPanelFeature } from '../components/boxs/device-in-room/device-features/light/lightFeatures';

// How the rows already in a devices widget are named
const NAMING_STYLES = {
  ROOM: 'room',
  DEVICE: 'device',
  GENERATED: 'generated',
  DEFAULT: 'default'
};

const getRoomName = entry => get(entry, 'device.room.name') || null;

/**
 * @description Tells how the rows of a devices widget are named: after the room of their device
 * ("Living room", "Kitchen" in a widget of temperatures), after their device ("Ceiling light"),
 * with the generated "Device (Feature)" label, or otherwise (names the user typed, or no row). The
 * majority wins; a tie goes to the more specific choice of the user (rooms, then devices).
 * @param {object} dictionary - The i18n dictionary, to rebuild the generated labels.
 * @param {Array} items - The rows of the widget: { entry: { device, feature }, name }.
 * @returns {string} One of NAMING_STYLES, DEFAULT when nothing tells.
 * @example detectNamingStyle(dictionary, [{ entry, name: 'Kitchen' }]);
 */
const detectNamingStyle = (dictionary, items) => {
  const counts = { room: 0, device: 0, generated: 0, other: 0 };
  items.forEach(({ entry, name }) => {
    if (!entry || !name) {
      return;
    }
    if (name === getRoomName(entry)) {
      counts.room += 1;
    } else if (name === entry.device.name) {
      counts.device += 1;
    } else if (name === getDeviceFeatureName(dictionary, entry.device, entry.feature)) {
      counts.generated += 1;
    } else {
      counts.other += 1;
    }
  });
  const best = Math.max(counts.room, counts.device, counts.generated, counts.other);
  if (best === 0 || counts.other === best) {
    return NAMING_STYLES.DEFAULT;
  }
  if (counts.room === best) {
    return NAMING_STYLES.ROOM;
  }
  if (counts.device === best) {
    return NAMING_STYLES.DEVICE;
  }
  return NAMING_STYLES.GENERATED;
};

// The light features of a same device share their name on purpose: the widget shows them as one
// row (see buildDeviceRows), named after the device
const sharesRowWith = (entry, other) =>
  isLightPanelFeature(entry.feature) &&
  isLightPanelFeature(other.feature) &&
  get(entry, 'device.selector') === get(other, 'device.selector');

/**
 * @description Gives the name a feature gets when it is added to a devices widget, consistent
 * with the names of the rows already there (docs/specs/dashboard-flexible-layout-and-widgets.md,
 * A.3.1 "Names that look like the widget"): the room name in a widget whose rows are named after
 * their room, the device name in a widget named after devices or for a light (shown as one row
 * named after its device), the generated "Device (Feature)" label otherwise. A name another row of
 * the widget already shows is skipped, so two rows never read the same.
 * @param {object} dictionary - The i18n dictionary.
 * @param {object} entry - The feature to name: { device, feature }, the device carrying its room.
 * @param {Array} items - The other rows of the widget: the existing ones, and the ones added with
 * this one, named or not yet ({ entry, name }).
 * @returns {string} The name to store in device_feature_names.
 * @example getSmartFeatureName(dictionary, { device, feature }, items);
 */
const getSmartFeatureName = (dictionary, entry, items = []) => {
  const defaultName = getDeviceFeatureName(dictionary, entry.device, entry.feature);
  const others = items.filter(item => item.entry && item.entry.feature.selector !== entry.feature.selector);
  const style = detectNamingStyle(
    dictionary,
    others.filter(item => item.name)
  );
  const roomName = getRoomName(entry);
  const deviceName = entry.device.name;
  const description = getDeviceFeatureDescription(dictionary, entry.device, entry.feature);

  const candidates = [];
  if (style === NAMING_STYLES.ROOM && roomName) {
    candidates.push(roomName, `${roomName} (${description})`);
  }
  // In a widget of generated labels, the new row gets its generated label too. Otherwise the device
  // name: in a widget whose rows are named after their device, for a light (one row named after its
  // device), and for a device that brings a single feature to the widget
  const featuresOfDevice = others.filter(item => get(item, 'entry.device.selector') === get(entry, 'device.selector'));
  if (
    style === NAMING_STYLES.DEVICE ||
    (style !== NAMING_STYLES.GENERATED && (isLightPanelFeature(entry.feature) || featuresOfDevice.length === 0))
  ) {
    candidates.push(deviceName);
  }
  const taken = name =>
    others.some(other => !sharesRowWith(entry, other.entry) && (other.name || other.defaultName) === name);
  const chosen = candidates.find(name => name && !taken(name));
  if (chosen) {
    return chosen;
  }
  // two devices with the same name: the generated label alone would read the same on two rows
  let unique = defaultName;
  for (let index = 2; taken(unique); index += 1) {
    unique = `${defaultName} ${index}`;
  }
  return unique;
};

/**
 * @description Names the features added to a devices widget in one go (a picker validation),
 * one after the other: each new row is named knowing the rows already there and the new rows
 * named before it, so two new rows never get the same name. A feature whose device is unknown
 * keeps no name (its row shows its selector).
 * @param {object} dictionary - The i18n dictionary.
 * @param {Array} existing - The rows kept in the widget: { entry, name }.
 * @param {Array} added - The rows added, in order: { entry }. Their `name` is set in place.
 * @returns {Array} The added rows, named.
 * @example nameAddedItems(dictionary, kept, added);
 */
const nameAddedItems = (dictionary, existing, added) => {
  added.forEach((item, index) => {
    if (!item.entry) {
      return;
    }
    const others = [...existing, ...added.filter((other, otherIndex) => otherIndex !== index)];
    item.name = getSmartFeatureName(dictionary, item.entry, others);
  });
  return added;
};

export { NAMING_STYLES, detectNamingStyle, getSmartFeatureName, nameAddedItems };
