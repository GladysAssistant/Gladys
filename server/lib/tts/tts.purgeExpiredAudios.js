/**
 * @description Drop the expired audio clips. Called lazily on every mint
 * and read: no timer to manage, and the map stays bounded by construction
 * (one entry per synthesis, 10 minutes of life).
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
}

module.exports = {
  purgeExpiredAudios,
};
