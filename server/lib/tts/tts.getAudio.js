const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description The audio clip behind a token minted by getSpeechUrl, or a
 * 404 for an unknown or expired token. The route serving it is
 * unauthenticated by design (a speaker cannot send a JWT): the
 * high-entropy token is the secret, scoped to this single clip.
 * @param {string} token - The audio token (without extension).
 * @returns {object} The { buffer, contentType } of the clip.
 * @example
 * const { buffer, contentType } = gladys.tts.getAudio('abc123');
 */
function getAudio(token) {
  this.purgeExpiredAudios();
  const audio = this.audios.get(token);
  if (!audio) {
    throw new NotFoundError('TTS_AUDIO_NOT_FOUND');
  }
  return { buffer: audio.buffer, contentType: audio.contentType };
}

module.exports = {
  getAudio,
};
