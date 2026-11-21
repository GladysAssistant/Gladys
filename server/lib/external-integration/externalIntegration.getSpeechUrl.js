const logger = require('../../utils/logger');
const { BadParameters, TooManyRequests } = require('../../utils/coreErrors');
const { Error503 } = require('../../utils/httpErrors');
const { MAX_TTS_TEXT_LENGTH, MAX_TTS_SPEECH_URLS_PER_MINUTE, TTS_LANGUAGE_REGEX } = require('./constants');

/**
 * @description Fixed one-minute window rate limit on POST /tts/speech_url,
 * in memory per integration — the POST /state mechanics (a burst
 * straddling the window boundary can reach ~2x the limit, acceptable for
 * this anti-flood purpose).
 * @param {object} service - The external integration service (plain object).
 * @example
 * this.assertSpeechUrlAllowed(service);
 */
function assertSpeechUrlAllowed(service) {
  const now = Date.now();
  let rateLimit = this.speechUrlRateLimits.get(service.id);
  if (!rateLimit || now >= rateLimit.resetAt) {
    rateLimit = { count: 0, resetAt: now + 60 * 1000 };
    this.speechUrlRateLimits.set(service.id, rateLimit);
  }
  if (rateLimit.count + 1 > MAX_TTS_SPEECH_URLS_PER_MINUTE) {
    throw new TooManyRequests(
      `RATE_LIMIT_EXCEEDED: max ${MAX_TTS_SPEECH_URLS_PER_MINUTE} speech URLs per minute`,
      Math.ceil((rateLimit.resetAt - now) / 1000),
    );
  }
  rateLimit.count += 1;
}

/**
 * @description Speak a text with the voice of the instance on behalf of an
 * external integration (POST /tts/speech_url of the host API): the third
 * consumer of gladys.tts.getSpeechUrl, next to the PLAY_NOTIFICATION scene
 * action and the voice assistant reply. The integration gets a URL its own
 * player fetches (a speaker it drives, a rabbit, a doorbell) — the LAN
 * http:// URL of the RAM clip with an integration provider, the signed
 * https:// URL with Gladys Plus. Open to every integration type: nothing is
 * read back but a clip of a text the integration supplied itself, and what
 * the call consumes (the provider's quota or CPU) is bounded by the
 * per-integration rate limit. Every failure of the voice — no provider
 * running, a timeout, an invalid clip, Gladys Plus 402/403/429 — answers a
 * single 503 TTS_UNAVAILABLE: the Gladys Plus codes are the upsell paths of
 * the Gladys UI, and relayed here they would read as "payment required",
 * "this integration is forbidden" or "you are rate limited" to an
 * integration that can act on none of them (capabilities/tts-type.md).
 * @param {object} service - The external integration service (plain object).
 * @param {object} body - The request body.
 * @param {string} body.text - The text to speak (1-2000 characters).
 * @param {string|null} [body.language] - Language hint (BCP 47 such as fr or en-US);
 * without one the first administrator's language is used.
 * @returns {Promise<object>} Resolve with { url }.
 * @example
 * const { url } = await gladys.externalIntegration.getSpeechUrl(service, { text: 'Bonjour !', language: 'fr' });
 */
async function getSpeechUrl(service, body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    throw new BadParameters('body: must be an object');
  }
  const { text, language = null } = body;
  // rejected, not truncated (unlike the relay to a provider): the
  // integration chose this text and can split it, a silently cut sentence
  // is worse than an explicit 400
  if (typeof text !== 'string' || text.trim().length === 0 || text.length > MAX_TTS_TEXT_LENGTH) {
    throw new BadParameters(`text: must be a non-blank string of at most ${MAX_TTS_TEXT_LENGTH} characters`);
  }
  if (language !== null && (typeof language !== 'string' || !TTS_LANGUAGE_REGEX.test(language))) {
    throw new BadParameters('language: must be a language tag such as "fr" or "en-US", or null');
  }
  // counted once the request is valid: a malformed call costs the
  // integration nothing, a valid one counts even if the voice then fails
  this.assertSpeechUrlAllowed(service);
  let result;
  try {
    result = await this.tts.getSpeechUrl({ text, language });
  } catch (e) {
    logger.warn(`TTS speech URL requested by integration ${service.selector} failed: ${e && e.message}`);
    throw new Error503('TTS_UNAVAILABLE');
  }
  // Gladys Plus can answer without a URL: nothing to hand to a player
  if (!result || typeof result.url !== 'string' || result.url.length === 0) {
    logger.warn(`TTS speech URL requested by integration ${service.selector}: the provider returned no URL`);
    throw new Error503('TTS_UNAVAILABLE');
  }
  return { url: result.url };
}

module.exports = {
  getSpeechUrl,
  assertSpeechUrlAllowed,
};
