import { DEVICE_FEATURE_CATEGORIES } from '../../../../../../../server/utils/constants';

// What Gladys can do with a device of the network, as GET /discovered tells it (docs/specs/zigbee2mqtt-pairing.md, E.2)
export const ZIGBEE2MQTT_SUPPORT = {
  NATIVE: 'native',
  GENERIC: 'generic',
  UNSUPPORTED: 'unsupported',
  INTERVIEW_FAILED: 'interview_failed'
};

// What a device has besides what it is: alone, nothing to control or read (E.1, D.4)
export const SECONDARY_CATEGORIES = [
  DEVICE_FEATURE_CATEGORIES.BATTERY,
  DEVICE_FEATURE_CATEGORIES.BATTERY_LOW,
  DEVICE_FEATURE_CATEGORIES.SIGNAL,
  DEVICE_FEATURE_CATEGORIES.DEVICE_TEMPERATURE_SENSOR
];

export const Z2M_SUPPORT_NEW_DEVICES_URL =
  'https://www.zigbee2mqtt.io/advanced/support-new-devices/01_support_new_devices.html';

const FORUM_NEW_TOPIC_URL = 'https://community.gladysassistant.com/new-topic';
const FORUM_CATEGORY = 'feature-requests';
// A longer URL may be refused on the way to the forum (E.4)
const FORUM_URL_MAX_LENGTH = 6000;
// The title and each field of the report, in characters, when even without the exposes the URL is too long. Five of
// them, each character encoded on 12 at most, stay under 6,000 with the rest of the URL
const FORUM_FIELD_MAX_LENGTH = 80;

// The start of a text, by character (never half of an emoji), "…" telling it was cut
const shorten = (text, max) => {
  const characters = Array.from(String(text));
  return characters.length > max ? `${characters.slice(0, max).join('')}…` : characters.join('');
};

/**
 * @description What Gladys can do with a discovered device; a device told by an older server is a supported one.
 * @param {object} device - A device of GET /discovered.
 * @returns {string} A ZIGBEE2MQTT_SUPPORT.
 * @example
 * getSupport({ zigbee2mqtt_support: 'generic' }); // 'generic'
 */
export const getSupport = device => (device && device.zigbee2mqtt_support) || ZIGBEE2MQTT_SUPPORT.NATIVE;

/**
 * @description Tell whether a device has a feature the user can control or read: not only a battery or a signal (E.1).
 * @param {Array} features - Its Gladys features.
 * @returns {boolean} True when one of them is not a secondary one.
 * @example
 * hasUsefulFeature([{ category: 'light' }]); // true
 */
export const hasUsefulFeature = features =>
  (features || []).some(feature => !SECONDARY_CATEGORIES.includes(feature.category));

/**
 * @description What the card of a discovered device can do with it (E.2, E.4 b).
 * @param {object} device - A device of GET /discovered.
 * @returns {object} `support`; `usable`: Gladys can add it, a supported model with a feature besides its battery (a
 * router and its signal included) or the generic features of a model Zigbee2mqtt does not know; `onlySecondary`: a
 * supported model of which Gladys only uses the battery or the signal, added all the same and suggested on the forum.
 * @example
 * getUsage({ zigbee2mqtt_support: 'native', features: [{ category: 'light' }] }); // usable, not onlySecondary
 */
export const getUsage = device => {
  const support = getSupport(device);
  const features = (device && device.features) || [];
  const native = support === ZIGBEE2MQTT_SUPPORT.NATIVE;
  const usable =
    support === ZIGBEE2MQTT_SUPPORT.GENERIC ||
    (native && features.some(feature => feature.category !== DEVICE_FEATURE_CATEGORIES.BATTERY));
  return { support, usable, onlySecondary: native && usable && !hasUsefulFeature(features) };
};

/**
 * @description How many devices of a list can be added with generic features: generic, not in Gladys yet (E.5).
 * @param {Array} devices - Devices of GET /discovered.
 * @returns {number} Their number.
 * @example
 * countGenericToAdd([{ zigbee2mqtt_support: 'generic' }]); // 1
 */
export const countGenericToAdd = devices =>
  (devices || []).filter(device => getSupport(device) === ZIGBEE2MQTT_SUPPORT.GENERIC && !device.created_at).length;

/**
 * @description The device to save: without what GET /discovered adds to it for the page (E.2).
 * @param {object} device - A device of GET /discovered.
 * @returns {object} The device without `zigbee2mqtt_support` and `zigbee2mqtt_info`.
 * @example
 * withoutSupportFields({ name: 'a', zigbee2mqtt_support: 'native' }); // { name: 'a' }
 */
export const withoutSupportFields = device => {
  // eslint-disable-next-line no-unused-vars
  const { zigbee2mqtt_support, zigbee2mqtt_info, ...rest } = device;
  return rest;
};

const formatClusters = clusters => (clusters.length ? clusters.join(', ') : '-');

/**
 * @description The text to paste in an issue of Zigbee2mqtt, for a model it does not know (E.4 a).
 * @param {object} device - A device of GET /discovered, with its `zigbee2mqtt_info`.
 * @returns {string} Its model ID, manufacturer, power source, clusters and generated exposes, in Markdown.
 * @example
 * getZigbee2mqttReport({ zigbee2mqtt_info: { model_id: 'TS0601', manufacturer: '_TZE200_abcd', endpoints: {} } });
 */
export const getZigbee2mqttReport = device => {
  const info = (device && device.zigbee2mqtt_info) || {};
  const endpoints = info.endpoints || {};
  const lines = [
    `- Model ID (zigbeeModel): \`${info.model_id || '-'}\``,
    `- Manufacturer name: \`${info.manufacturer || '-'}\``,
    `- Power source: ${info.power_source || '-'}`,
    `- Interview: ${info.interview_state || '-'}`,
    '',
    '### Endpoints',
    ...Object.keys(endpoints).map(
      id =>
        `- ${id}: input ${formatClusters(endpoints[id].clusters.input)}; output ${formatClusters(
          endpoints[id].clusters.output
        )}`
    )
  ];
  const exposes = info.definition && info.definition.exposes;
  if (exposes && exposes.length) {
    lines.push('', '### Generated exposes', '```json', JSON.stringify(exposes, null, 2), '```');
  }
  return lines.join('\n');
};

/**
 * @description A new topic of the Gladys forum, prefilled, for a model Zigbee2mqtt knows and Gladys cannot convert
 * (E.4 b). Its exposes are cut, and said so, for the URL to stay under 6,000 characters; its title and fields too, with
 * "…", only when they alone would not fit.
 * @param {object} device - A device of GET /discovered, with its `zigbee2mqtt_info`.
 * @param {string} title - The title of the topic, in the language of the user.
 * @param {string} cutNotice - What replaces the end of the exposes when they are cut.
 * @returns {string} The URL.
 * @example
 * getForumUrl(device, 'Zigbee2MQTT: support for IKEA E1743', '(cut)');
 */
export const getForumUrl = (device, title, cutNotice) => {
  const info = (device && device.zigbee2mqtt_info) || {};
  const definition = info.definition || {};
  // The title and the fields as they are, or cut to a few words (max) when even without the exposes they do not fit
  const builder = max => {
    const field = value => shorten(value || '-', max);
    const head = [
      `- Model: \`${field(definition.model)}\``,
      `- Vendor: ${field(definition.vendor)}`,
      `- Description: ${field(definition.description)}`,
      `- Model ID: \`${field(info.model_id)}\``,
      '',
      '```json'
    ].join('\n');
    return exposes =>
      `${FORUM_NEW_TOPIC_URL}?title=${encodeURIComponent(
        shorten(title, max)
      )}&category=${FORUM_CATEGORY}&body=${encodeURIComponent(`${head}\n${exposes}\n\`\`\``)}`;
  };
  const exposes = JSON.stringify(definition.exposes || [], null, 2);
  const url = builder(Infinity)(exposes);
  if (url.length <= FORUM_URL_MAX_LENGTH) {
    return url;
  }
  // The longest start of the exposes that fits, the encoding of each character varying. By character, not by UTF-16
  // unit: half of an emoji would make encodeURIComponent throw
  const characters = Array.from(exposes);
  const start = count => `${characters.slice(0, count).join('')}\n${cutNotice}`;
  const full = builder(Infinity);
  const build = full(start(0)).length <= FORUM_URL_MAX_LENGTH ? full : builder(FORUM_FIELD_MAX_LENGTH);
  let low = 0;
  let high = characters.length;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (build(start(middle)).length <= FORUM_URL_MAX_LENGTH) {
      low = middle;
    } else {
      high = middle - 1;
    }
  }
  return build(start(low));
};
