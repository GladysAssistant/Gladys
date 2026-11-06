const logger = require('../../utils/logger');
const { MUSIC_MEDIA_TYPES, MUSIC_ARTWORK_KEY_REGEX } = require('../../utils/constants');
const { MAX_MUSIC_ITEMS_PER_RESPONSE, MAX_MUSIC_MEDIA_ID_LENGTH, MAX_MUSIC_ITEM_TEXT_LENGTH } = require('./constants');

const MEDIA_TYPES = Object.values(MUSIC_MEDIA_TYPES);

/**
 * @description Bound a text field of a MediaItem: a string truncated at the
 * cap, anything else dropped.
 * @param {any} value - The published value.
 * @returns {string|null} The bounded text, or null.
 * @example
 * boundText('Blue in Green');
 */
function boundText(value) {
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }
  return value.substring(0, MAX_MUSIC_ITEM_TEXT_LENGTH);
}

/**
 * @description Normalize one MediaItem published by an integration
 * (capabilities/music.md, section 4.2): only the known fields are kept, each
 * bounded; a missing id or title, or a type outside the core enum, drops the
 * item. The payload comes from unaudited code and is rendered to the user.
 * @param {any} item - The published item.
 * @returns {object|null} The normalized item, or null when dropped.
 * @example
 * normalizeMediaItem({ id: 'spotify:track:1', type: 'track', title: 'Blue in Green' });
 */
function normalizeMediaItem(item) {
  if (item === null || typeof item !== 'object' || Array.isArray(item)) {
    return null;
  }
  const id = typeof item.id === 'string' ? item.id : null;
  const title = boundText(item.title);
  if (id === null || id.length === 0 || id.length > MAX_MUSIC_MEDIA_ID_LENGTH || title === null) {
    return null;
  }
  if (!MEDIA_TYPES.includes(item.type)) {
    return null;
  }
  const duration = Number.isInteger(item.duration) && item.duration >= 0 ? item.duration : null;
  const artworkKey =
    typeof item.artwork_key === 'string' && MUSIC_ARTWORK_KEY_REGEX.test(item.artwork_key) ? item.artwork_key : null;
  return {
    id,
    type: item.type,
    title,
    subtitle: boundText(item.subtitle),
    duration,
    artwork_key: artworkKey,
    browsable: item.browsable === true,
    playable: item.playable === true,
  };
}

/**
 * @description Normalize a list of MediaItems: invalid items are dropped with
 * a warning naming the integration, the list is capped.
 * @param {any} items - The published list.
 * @param {string} context - The integration selector and operation, for the log.
 * @returns {Array<object>} The normalized items.
 * @example
 * normalizeMediaItems(payload.items, 'ext-sonos/browse');
 */
function normalizeMediaItems(items, context) {
  if (!Array.isArray(items)) {
    return [];
  }
  const normalized = [];
  let dropped = 0;
  items.slice(0, MAX_MUSIC_ITEMS_PER_RESPONSE).forEach((item) => {
    const normalizedItem = normalizeMediaItem(item);
    if (normalizedItem === null) {
      dropped += 1;
    } else {
      normalized.push(normalizedItem);
    }
  });
  if (dropped > 0) {
    logger.warn(`Music ${context}: ${dropped} invalid media item(s) dropped`);
  }
  return normalized;
}

/**
 * @description Bound a count published by an integration (a queue total, a
 * browse total): a non-negative integer, else the fallback.
 * @param {any} value - The published value.
 * @param {number} fallback - The value when absent or invalid.
 * @returns {number} The bounded count.
 * @example
 * boundCount(payload.total, items.length);
 */
function boundCount(value, fallback) {
  return Number.isInteger(value) && value >= 0 ? value : fallback;
}

/**
 * @description Normalize a browse answer: `{ items, total }`.
 * @param {any} data - The command-result data.
 * @param {string} context - The integration selector, for the log.
 * @returns {object} The normalized answer.
 * @example
 * normalizeBrowseResult(result.data, 'ext-sonos');
 */
function normalizeBrowseResult(data, context) {
  const payload = data && typeof data === 'object' ? data : {};
  const items = normalizeMediaItems(payload.items, `${context}/browse`);
  return { items, total: Math.max(boundCount(payload.total, items.length), items.length) };
}

/**
 * @description Normalize a search answer: `{ items }`.
 * @param {any} data - The command-result data.
 * @param {string} context - The integration selector, for the log.
 * @returns {object} The normalized answer.
 * @example
 * normalizeSearchResult(result.data, 'ext-sonos');
 */
function normalizeSearchResult(data, context) {
  const payload = data && typeof data === 'object' ? data : {};
  return { items: normalizeMediaItems(payload.items, `${context}/search`) };
}

/**
 * @description Normalize a queue answer: `{ items, current_index, total }`,
 * `current_index` and `total` describing the full queue (`current_index`
 * null when nothing plays or when it is out of the queue).
 * @param {any} data - The command-result data.
 * @param {string} context - The integration selector, for the log.
 * @returns {object} The normalized answer.
 * @example
 * normalizeQueueResult(result.data, 'ext-sonos');
 */
function normalizeQueueResult(data, context) {
  const payload = data && typeof data === 'object' ? data : {};
  const items = normalizeMediaItems(payload.items, `${context}/queue`);
  const total = Math.max(boundCount(payload.total, items.length), items.length);
  const currentIndex =
    Number.isInteger(payload.current_index) && payload.current_index >= 0 && payload.current_index < total
      ? payload.current_index
      : null;
  return { items, current_index: currentIndex, total };
}

module.exports = {
  normalizeMediaItem,
  normalizeMediaItems,
  normalizeBrowseResult,
  normalizeSearchResult,
  normalizeQueueResult,
};
