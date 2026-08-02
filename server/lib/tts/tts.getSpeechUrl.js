const crypto = require('crypto');

const { NotFoundError, BadParameters } = require('../../utils/coreErrors');
const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');
const { MAX_TTS_AUDIO_SIZE_BYTES, TTS_AUDIO_CONTENT_TYPES } = require('../external-integration/constants');
const { GLADYS_PLUS_PROVIDER, TTS_AUDIO_TTL_MS, TTS_AUDIO_TOKEN_BYTES } = require('./constants');

/**
 * @description Turn a text into a URL a player can fetch (Sonos trackUri,
 * Cast, browser Audio element), through the active TTS provider.
 * Gladys Plus: the gateway's signed public URL, unchanged behavior
 * (including the 403/429 paths feeding the existing upsell). Integration
 * provider: the audio bytes are kept in RAM behind a high-entropy token
 * and served by GET /api/v1/tts/audio/:token — a LAN URL by construction
 * (documented limitation: not reachable through Gladys Plus remote access).
 * A configured provider that is uninstalled or stopped throws: a silent
 * fallback to another voice would be a surprise, not a service.
 * @param {object} options - Speech options.
 * @param {string} options.text - The text to speak.
 * @param {string} [options.language] - Best-effort language hint.
 * @returns {Promise<object>} Resolve with { url, provider }.
 * @example
 * const { url } = await gladys.tts.getSpeechUrl({ text: 'Hello!' });
 */
async function getSpeechUrl({ text, language = null }) {
  const activeProvider =
    (await this.variable.getValue(SYSTEM_VARIABLE_NAMES.TTS_ACTIVE_PROVIDER)) || GLADYS_PLUS_PROVIDER;
  if (activeProvider === GLADYS_PLUS_PROVIDER) {
    const response = await this.gateway.getTTSApiUrl({ text });
    return { url: (response && response.url) || null, provider: GLADYS_PLUS_PROVIDER };
  }
  const providerService = this.service.getService(activeProvider);
  if (!providerService || !providerService.tts || typeof providerService.tts.synthesize !== 'function') {
    throw new NotFoundError(`TTS provider "${activeProvider}" is not available`);
  }
  const { buffer, contentType, extension } = await providerService.tts.synthesize({ text, language });
  // defense in depth: the external-integration proxy already validates all
  // of this, but nothing here is served or put in a URL without being
  // checked against the curated list and the size bound — whatever service
  // implements the provider interface
  const expectedExtension = Object.prototype.hasOwnProperty.call(TTS_AUDIO_CONTENT_TYPES, contentType)
    ? TTS_AUDIO_CONTENT_TYPES[contentType]
    : undefined;
  const validBuffer = Buffer.isBuffer(buffer) && buffer.length > 0 && buffer.length <= MAX_TTS_AUDIO_SIZE_BYTES;
  if (!validBuffer || !expectedExtension || extension !== expectedExtension) {
    throw new BadParameters(`TTS provider "${activeProvider}" returned an invalid audio payload`);
  }
  this.purgeExpiredAudios();
  const token = crypto.randomBytes(TTS_AUDIO_TOKEN_BYTES).toString('hex');
  this.audios.set(token, { buffer, contentType, expiresAt: Date.now() + TTS_AUDIO_TTL_MS });
  const url = `${this.getLocalApiBaseUrl()}/api/v1/tts/audio/${token}.${extension}`;
  return { url, provider: activeProvider };
}

module.exports = {
  getSpeechUrl,
};
