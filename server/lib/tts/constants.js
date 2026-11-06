// Reserved id of the built-in Gladys Plus provider (dispatch to
// gateway.getTTSApiUrl, signed public URL — keeps working through remote
// access). It is the default and fallback value of the TTS_ACTIVE_PROVIDER
// system variable.
const GLADYS_PLUS_PROVIDER = 'gladys-plus';
// Synthesized clips live in RAM only (the discovered-devices doctrine: no
// table, nothing on disk) behind a high-entropy token — the token is the
// secret, exactly the trust model of the signed Gladys Plus URL. A speaker
// fetches the URL within seconds; 10 minutes covers every retry.
const TTS_AUDIO_TTL_MS = 10 * 60 * 1000;
const TTS_AUDIO_TOKEN_BYTES = 32;
// The TTL alone does not bound the cache: a tight loop of announcements
// could hold many 5 MB clips for 10 minutes. The oldest clips are evicted
// beyond this many entries (≤ 100 MB worst case) — a speaker fetches its
// URL within seconds, so an evicted clip is one nobody is still playing.
const TTS_AUDIO_MAX_ENTRIES = 20;

module.exports = {
  GLADYS_PLUS_PROVIDER,
  TTS_AUDIO_TTL_MS,
  TTS_AUDIO_TOKEN_BYTES,
  TTS_AUDIO_MAX_ENTRIES,
};
