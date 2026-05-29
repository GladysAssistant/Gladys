const { Error400 } = require('../../utils/httpErrors');

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
  throw new Error400('Missing audio body');
}

const DEFAULT_AUDIO_CONTENT_TYPE = 'application/octet-stream';

/**
 * @description Read audio Content-Type from the request (forwarded to Gladys Plus STT).
 * @param {object} req - Express request.
 * @returns {string} MIME type for the audio body.
 * @example
 * getAudioContentTypeFromRequest(req);
 */
function getAudioContentTypeFromRequest(req) {
  const raw = req.headers && req.headers['content-type'];
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

module.exports = {
  getAudioBufferFromRequest,
  getAudioContentTypeFromRequest,
  DEFAULT_AUDIO_CONTENT_TYPE,
};
