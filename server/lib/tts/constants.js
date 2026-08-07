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

module.exports = {
  GLADYS_PLUS_PROVIDER,
  TTS_AUDIO_TTL_MS,
  TTS_AUDIO_TOKEN_BYTES,
};
