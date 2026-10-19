const { BadParameters } = require('../../../utils/coreErrors');
const { MUSIC_MEDIA_TYPES } = require('../../../utils/constants');
const {
  MAX_MUSIC_SEARCH_QUERY_LENGTH,
  MUSIC_SEARCH_DEFAULT_LIMIT,
  MUSIC_SEARCH_MAX_LIMIT,
} = require('../../external-integration/constants');
const { parseBoundedInteger } = require('./music.getPlayer');

const MEDIA_TYPES = Object.values(MUSIC_MEDIA_TYPES);

/**
 * @description Search the catalog of a player (capabilities/music.md, section 4.3).
 * @param {string} selector - The device selector.
 * @param {object} options - The search.
 * @param {string} options.q - The query (1–200 characters).
 * @param {string} [options.type] - A media type to filter on.
 * @param {number|string} [options.limit] - The page size (default 20, max 50).
 * @returns {Promise<object>} Resolve with `{ items }`.
 * @example
 * const results = await gladys.device.music.search('kitchen-speaker', { q: 'jazz' });
 */
async function search(selector, { q, type, limit } = {}) {
  const { device, music } = this.getPlayer(selector);
  if (typeof q !== 'string' || q.trim().length === 0 || q.length > MAX_MUSIC_SEARCH_QUERY_LENGTH) {
    throw new BadParameters(`q: must be a string of 1 to ${MAX_MUSIC_SEARCH_QUERY_LENGTH} characters`);
  }
  let mediaType = null;
  if (type !== undefined && type !== null && type !== '') {
    if (!MEDIA_TYPES.includes(type)) {
      throw new BadParameters(`type: must be one of ${MEDIA_TYPES.join(', ')}`);
    }
    mediaType = type;
  }
  return music.search(device, {
    query: q.trim(),
    type: mediaType,
    limit: parseBoundedInteger(limit, {
      name: 'limit',
      min: 1,
      max: MUSIC_SEARCH_MAX_LIMIT,
      fallback: MUSIC_SEARCH_DEFAULT_LIMIT,
    }),
  });
}

module.exports = {
  search,
};
