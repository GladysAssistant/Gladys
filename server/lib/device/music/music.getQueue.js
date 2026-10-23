const { MUSIC_BROWSE_DEFAULT_LIMIT, MUSIC_BROWSE_MAX_LIMIT } = require('../../external-integration/constants');
const { parseBoundedInteger } = require('./music.getPlayer');

/**
 * @description A page of the queue of a player (capabilities/music.md,
 * section 4.3): `current_index` and `total` describe the full queue, `items`
 * the requested page.
 * @param {string} selector - The device selector.
 * @param {object} options - The page.
 * @param {number|string} [options.offset] - The page offset (default 0).
 * @param {number|string} [options.limit] - The page size (default 50, max 100).
 * @returns {Promise<object>} Resolve with `{ items, current_index, total }`.
 * @example
 * const queue = await gladys.device.music.getQueue('kitchen-speaker', { offset: 0, limit: 50 });
 */
async function getQueue(selector, { offset, limit } = {}) {
  const { device, music } = this.getPlayer(selector);
  return music.getQueue(device, {
    offset: parseBoundedInteger(offset, { name: 'offset', min: 0, fallback: 0 }),
    limit: parseBoundedInteger(limit, {
      name: 'limit',
      min: 1,
      max: MUSIC_BROWSE_MAX_LIMIT,
      fallback: MUSIC_BROWSE_DEFAULT_LIMIT,
    }),
  });
}

module.exports = {
  getQueue,
};
