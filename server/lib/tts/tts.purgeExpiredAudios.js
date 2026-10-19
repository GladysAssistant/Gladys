const { TTS_AUDIO_MAX_ENTRIES } = require('./constants');

/**
 * @description Drop the expired audio clips, then the oldest ones beyond
 * the entry cap. Called lazily on every mint and read: no timer to manage,
 * and the cache stays bounded by construction — by time (10 minutes of
 * life) and by size (at most TTS_AUDIO_MAX_ENTRIES clips, the Map keeping
 * its insertion order so the oldest are evicted first).
 * @example
 * gladys.tts.purgeExpiredAudios();
 */
function purgeExpiredAudios() {
  const now = Date.now();
  this.audios.forEach((audio, token) => {
    if (audio.expiresAt <= now) {
      this.audios.delete(token);
    }
  });
  const excess = this.audios.size - TTS_AUDIO_MAX_ENTRIES;
  if (excess > 0) {
    [...this.audios.keys()].slice(0, excess).forEach((token) => this.audios.delete(token));
  }
}

module.exports = {
  purgeExpiredAudios,
};
