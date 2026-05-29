const get = require('get-value');
const logger = require('../../utils/logger');
const { Error403, Error429 } = require('../../utils/httpErrors');

/**
 * @description Transcribe audio via Gladys Plus STT API.
 * @param {Buffer} audio - Raw audio buffer (application/octet-stream).
 * @returns {Promise<object>} STT API response.
 * @example
 * stt(audioBuffer);
 */
async function stt(audio) {
  try {
    const response = await this.gladysGatewayClient.stt(audio);
    return response;
  } catch (e) {
    logger.warn(e);
    const status = get(e, 'response.status');
    const message = get(e, 'response.data.error_message');
    if (status === 403) {
      throw new Error403(message);
    }
    if (status === 429) {
      throw new Error429(message);
    }
    throw e;
  }
}

module.exports = {
  stt,
};
