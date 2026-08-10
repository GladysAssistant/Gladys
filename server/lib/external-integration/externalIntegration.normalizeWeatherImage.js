const { ExternalIntegrationUnavailableError } = require('../../utils/coreErrors');
const { MAX_WEATHER_IMAGE_BYTES } = require('./constants');

// magic numbers of the only two accepted formats
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];
const JPEG_MAGIC = [0xff, 0xd8, 0xff];

// base64 encodes 3 bytes in 4 chars: any string longer than this cannot
// decode under the size cap, and is rejected before the decode allocates
const MAX_BASE64_LENGTH = Math.ceil(MAX_WEATHER_IMAGE_BYTES / 3) * 4 + 4;

/**
 * @description Validate the provider image returned over
 * weather.get-image (B.18 point 6). The raw base64 comes from unaudited
 * code: the decoded bytes must be a PNG or a JPEG (magic numbers) and stay
 * under the size cap. Returns a data URI served from the Gladys origin —
 * re-encoded from the decoded bytes, so stray characters of the original
 * base64 never reach the browser.
 * @param {any} rawBase64 - The data.image of the command-result.
 * @returns {string} The validated image as a data URI.
 * @example
 * const image = normalizeWeatherImage('iVBORw0KGgo...');
 */
function normalizeWeatherImage(rawBase64) {
  if (typeof rawBase64 !== 'string' || rawBase64.length === 0 || rawBase64.length > MAX_BASE64_LENGTH) {
    throw new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_INVALID_WEATHER_IMAGE');
  }
  const bytes = Buffer.from(rawBase64, 'base64');
  if (bytes.length === 0 || bytes.length > MAX_WEATHER_IMAGE_BYTES) {
    throw new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_INVALID_WEATHER_IMAGE');
  }
  const isPng = bytes.length > PNG_MAGIC.length && PNG_MAGIC.every((byte, index) => bytes[index] === byte);
  const isJpeg = bytes.length > JPEG_MAGIC.length && JPEG_MAGIC.every((byte, index) => bytes[index] === byte);
  if (!isPng && !isJpeg) {
    throw new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_INVALID_WEATHER_IMAGE');
  }
  return `data:image/${isPng ? 'png' : 'jpeg'};base64,${bytes.toString('base64')}`;
}

module.exports = {
  normalizeWeatherImage,
};
