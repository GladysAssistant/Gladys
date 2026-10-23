const { BadParameters } = require('../../../utils/coreErrors');
const { MUSIC_MEDIA_TYPES, MUSIC_PLAY_MODES } = require('../../../utils/constants');
const { MAX_MUSIC_MEDIA_ID_LENGTH } = require('../../external-integration/constants');

const MEDIA_TYPES = Object.values(MUSIC_MEDIA_TYPES);
const PLAY_MODES = Object.values(MUSIC_PLAY_MODES);

/**
 * @description Start a media on a player (capabilities/music.md, section
 * 4.3): the `id` is opaque and flows back to the integration that produced
 * it. `replace` replaces the current playback; `next` and `append` enqueue,
 * on integrations declaring `music.append`.
 * @param {string} selector - The device selector.
 * @param {object} media - The media reference `{ id, type }`.
 * @param {string} [mode] - The play mode (default `replace`).
 * @returns {Promise} Resolve when the integration acked.
 * @example
 * await gladys.device.music.play('kitchen-speaker', { id: 'spotify:playlist:1', type: 'playlist' });
 */
async function play(selector, media, mode = MUSIC_PLAY_MODES.REPLACE) {
  const { device, music } = this.getPlayer(selector);
  if (media === null || typeof media !== 'object' || Array.isArray(media)) {
    throw new BadParameters('media: must be an object');
  }
  if (typeof media.id !== 'string' || media.id.length === 0 || media.id.length > MAX_MUSIC_MEDIA_ID_LENGTH) {
    throw new BadParameters(`media.id: must be a string of 1 to ${MAX_MUSIC_MEDIA_ID_LENGTH} characters`);
  }
  if (!MEDIA_TYPES.includes(media.type)) {
    throw new BadParameters(`media.type: must be one of ${MEDIA_TYPES.join(', ')}`);
  }
  const playMode = mode === undefined || mode === null ? MUSIC_PLAY_MODES.REPLACE : mode;
  if (!PLAY_MODES.includes(playMode)) {
    throw new BadParameters(`mode: must be one of ${PLAY_MODES.join(', ')}`);
  }
  await music.play(device, { id: media.id, type: media.type }, playMode);
}

module.exports = {
  play,
};
