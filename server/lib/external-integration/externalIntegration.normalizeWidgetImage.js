const { ExternalIntegrationUnavailableError } = require('../../utils/coreErrors');
const { MAX_WIDGET_IMAGE_BYTES } = require('./constants');

const INVALID_IMAGE_ERROR = 'EXTERNAL_INTEGRATION_INVALID_WIDGET_IMAGE';

// magic numbers of the accepted formats: PNG, JPEG, and WebP (a RIFF
// container whose type is 'WEBP' — the format every poster CDN serves)
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47];
const JPEG_MAGIC = [0xff, 0xd8, 0xff];
const RIFF_MAGIC = [0x52, 0x49, 0x46, 0x46];
const WEBP_MAGIC = [0x57, 0x45, 0x42, 0x50];
const WEBP_MAGIC_OFFSET = 8;

// base64 encodes 3 bytes in 4 chars: any string longer than this cannot
// decode under the size cap, and is rejected before the decode allocates
const MAX_BASE64_LENGTH = Math.ceil(MAX_WIDGET_IMAGE_BYTES / 3) * 4 + 4;

/**
 * @description True when the bytes start with the given magic at an offset.
 * @param {Buffer} bytes - The decoded image.
 * @param {Array<number>} magic - The expected bytes.
 * @param {number} [offset] - Where the magic starts.
 * @returns {boolean} True when the magic matches.
 * @example
 * hasMagic(bytes, PNG_MAGIC);
 */
function hasMagic(bytes, magic, offset = 0) {
  return bytes.length > offset + magic.length && magic.every((byte, index) => bytes[offset + index] === byte);
}

/**
 * @description Validate an image returned by an integration over
 * widget.get-image (section 6 of capabilities/dashboard-widgets.md). The raw
 * base64 comes from unaudited code: the decoded bytes must be a PNG, a JPEG
 * or a WebP (magic numbers) under the size cap. Returns a data URI served
 * from the Gladys origin, re-encoded from the decoded bytes so stray
 * characters of the original base64 never reach the browser.
 * @param {any} rawBase64 - The data.image of the command-result (no data-URI prefix).
 * @returns {string} The validated image as a data URI.
 * @example
 * const image = normalizeWidgetImage('iVBORw0KGgo...');
 */
function normalizeWidgetImage(rawBase64) {
  if (typeof rawBase64 !== 'string' || rawBase64.length === 0 || rawBase64.length > MAX_BASE64_LENGTH) {
    throw new ExternalIntegrationUnavailableError(INVALID_IMAGE_ERROR);
  }
  const bytes = Buffer.from(rawBase64, 'base64');
  if (bytes.length === 0 || bytes.length > MAX_WIDGET_IMAGE_BYTES) {
    throw new ExternalIntegrationUnavailableError(INVALID_IMAGE_ERROR);
  }
  let mimeType = null;
  if (hasMagic(bytes, PNG_MAGIC)) {
    mimeType = 'image/png';
  } else if (hasMagic(bytes, JPEG_MAGIC)) {
    mimeType = 'image/jpeg';
  } else if (hasMagic(bytes, RIFF_MAGIC) && hasMagic(bytes, WEBP_MAGIC, WEBP_MAGIC_OFFSET)) {
    mimeType = 'image/webp';
  }
  if (mimeType === null) {
    throw new ExternalIntegrationUnavailableError(INVALID_IMAGE_ERROR);
  }
  return `data:${mimeType};base64,${bytes.toString('base64')}`;
}

module.exports = {
  normalizeWidgetImage,
  INVALID_IMAGE_ERROR,
};
