const { BadParameters } = require('../../../utils/coreErrors');
const {
  MAX_MUSIC_MEDIA_ID_LENGTH,
  MUSIC_BROWSE_DEFAULT_LIMIT,
  MUSIC_BROWSE_MAX_LIMIT,
} = require('../../external-integration/constants');
const { parseBoundedInteger } = require('./music.getPlayer');

/**
 * @description Browse the catalog of a player (capabilities/music.md, section
 * 4.3): the root entry points without `parent_id`, the children of a
 * browsable item with it.
 * @param {string} selector - The device selector.
 * @param {object} options - The page.
 * @param {string} [options.parent_id] - The id of the browsable item, absent for the root.
 * @param {number|string} [options.offset] - The page offset (default 0).
 * @param {number|string} [options.limit] - The page size (default 50, max 100).
 * @returns {Promise<object>} Resolve with `{ items, total }`.
 * @example
 * const page = await gladys.device.music.browse('kitchen-speaker', { parent_id: 'favorites' });
 */
async function browse(selector, { parent_id: parentId, offset, limit } = {}) {
  const { device, music } = this.getPlayer(selector);
  let parent = null;
  if (parentId !== undefined && parentId !== null && parentId !== '') {
    if (typeof parentId !== 'string' || parentId.length > MAX_MUSIC_MEDIA_ID_LENGTH) {
      throw new BadParameters(`parent_id: must be a string of at most ${MAX_MUSIC_MEDIA_ID_LENGTH} characters`);
    }
    parent = parentId;
  }
  return music.browse(device, {
    parentId: parent,
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
  browse,
};
