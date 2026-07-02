const { Error400 } = require('../../utils/httpErrors');

/** @description JSON body flag when audio is sent through the Gladys Gateway WebSocket. */
const GLADYS_GATEWAY_BINARY_BODY = 'gladys_binary_body';

/**
 * @description Read raw audio from the request body.
 * @param {object} req - Express request.
 * @returns {Buffer} Audio buffer.
 * @example
 * getAudioBufferFromRequest(req);
 */
function getAudioBufferFromRequest(req) {
  if (Buffer.isBuffer(req.body) && req.body.length > 0) {
    return req.body;
  }

  if (
    req.body &&
    req.body[GLADYS_GATEWAY_BINARY_BODY] === true &&
    typeof req.body.data === 'string' &&
    req.body.data.length > 0
  ) {
    return Buffer.from(req.body.data, 'base64');
  }

  throw new Error400('Missing audio body');
}

const DEFAULT_AUDIO_CONTENT_TYPE = 'application/octet-stream';

/**
 * @description Normalize a Content-Type header value for audio STT.
 * @param {string} [raw] - Raw Content-Type header or body field.
 * @returns {string} MIME type for the audio body.
 * @example
 * normalizeAudioContentType('audio/wav; charset=binary');
 */
function normalizeAudioContentType(raw) {
  if (!raw || typeof raw !== 'string') {
    return DEFAULT_AUDIO_CONTENT_TYPE;
  }

  const contentType = raw
    .split(';')[0]
    .trim()
    .toLowerCase();
  if (contentType.startsWith('audio/') || contentType === 'application/octet-stream') {
    return contentType;
  }

  return DEFAULT_AUDIO_CONTENT_TYPE;
}

/**
 * @description Read audio Content-Type from the request (forwarded to Gladys Plus STT).
 * @param {object} req - Express request.
 * @returns {string} MIME type for the audio body.
 * @example
 * getAudioContentTypeFromRequest(req);
 */
function getAudioContentTypeFromRequest(req) {
  if (req.body && req.body[GLADYS_GATEWAY_BINARY_BODY] === true && req.body.content_type) {
    return normalizeAudioContentType(req.body.content_type);
  }

  const raw = req.headers && req.headers['content-type'];
  return normalizeAudioContentType(raw);
}

module.exports = {
  getAudioBufferFromRequest,
  getAudioContentTypeFromRequest,
  DEFAULT_AUDIO_CONTENT_TYPE,
  GLADYS_GATEWAY_BINARY_BODY,
};
