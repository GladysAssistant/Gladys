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

module.exports = {
  getAudioBufferFromRequest,
};
