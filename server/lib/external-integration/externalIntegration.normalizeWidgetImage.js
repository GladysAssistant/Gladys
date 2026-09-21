const { ExternalIntegrationUnavailableError } = require('../../utils/coreErrors');
const { MAX_WIDGET_IMAGE_BYTES, MAX_WIDGET_IMAGE_DIMENSION } = require('./constants');

// One code per refusal, so the developer reads *why* an image was refused
// (field feedback, topic 10641: poster CDNs serve files over the size cap,
// and a single opaque code cost the author an afternoon of tracing). Each
// error carries a core-authored `details` sentence with the measured value
// against the bound, logged by the caller and echoed in the route's 400.
const WIDGET_IMAGE_ERRORS = {
  // no image, an empty string, a non-string: the integration answered nothing usable
  INVALID: 'EXTERNAL_INTEGRATION_INVALID_WIDGET_IMAGE',
  TOO_LARGE: 'EXTERNAL_INTEGRATION_WIDGET_IMAGE_TOO_LARGE',
  UNSUPPORTED_FORMAT: 'EXTERNAL_INTEGRATION_WIDGET_IMAGE_UNSUPPORTED_FORMAT',
  DIMENSIONS_EXCEEDED: 'EXTERNAL_INTEGRATION_WIDGET_IMAGE_DIMENSIONS_EXCEEDED',
};
const WIDGET_IMAGE_ERROR_CODES = Object.values(WIDGET_IMAGE_ERRORS);
const MAX_WIDGET_IMAGE_KB = Math.round(MAX_WIDGET_IMAGE_BYTES / 1024);

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
 * @description Build the error of a refused image: the code names the rule,
 * `details` states the measured value against the bound.
 * @param {string} code - One of WIDGET_IMAGE_ERRORS.
 * @param {string} details - The core-authored reason.
 * @returns {ExternalIntegrationUnavailableError} The error to throw.
 * @example
 * throw imageError(WIDGET_IMAGE_ERRORS.TOO_LARGE, '378 KB received, 300 KB allowed');
 */
function imageError(code, details) {
  const error = new ExternalIntegrationUnavailableError(code);
  error.details = details;
  return error;
}

/**
 * @description Format a byte count in KB for the error details.
 * @param {number} bytes - The byte count.
 * @returns {string} The count in KB.
 * @example
 * toKb(387072); // '378 KB'
 */
function toKb(bytes) {
  return `${Math.ceil(bytes / 1024)} KB`;
}

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
 * @description Read the pixel size of a PNG from its IHDR chunk (always the
 * first chunk: 8 signature bytes, 4 length bytes, 'IHDR', width, height).
 * @param {Buffer} bytes - The decoded image.
 * @returns {object|null} { width, height }, or null when the header is not there.
 * @example
 * readPngDimensions(bytes);
 */
function readPngDimensions(bytes) {
  if (bytes.length < 24 || bytes.toString('ascii', 12, 16) !== 'IHDR') {
    return null;
  }
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}

/**
 * @description Read the pixel size of a JPEG from its first SOF marker
 * (start of frame: 0xFFC0-0xFFCF minus the DHT/JPG/DAC markers), walking the
 * marker segments from the start of the file.
 * @param {Buffer} bytes - The decoded image.
 * @returns {object|null} { width, height }, or null when no frame header is found.
 * @example
 * readJpegDimensions(bytes);
 */
function readJpegDimensions(bytes) {
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      return null;
    }
    const marker = bytes[offset + 1];
    if (marker === 0xff) {
      // padding byte between markers
      offset += 1;
    } else if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      // standalone markers without a length
      offset += 2;
    } else {
      const isStartOfFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isStartOfFrame) {
        // length (2), precision (1), height (2), width (2)
        return { height: bytes.readUInt16BE(offset + 5), width: bytes.readUInt16BE(offset + 7) };
      }
      if (marker === 0xd9 || marker === 0xda) {
        // end of image / start of scan reached without a frame header
        return null;
      }
      offset += 2 + bytes.readUInt16BE(offset + 2);
    }
  }
  return null;
}

/**
 * @description Read the pixel size of a WebP from its first chunk: 'VP8 '
 * (lossy: 14-bit width and height after the 3-byte start code), 'VP8L'
 * (lossless: 14-bit fields after the signature byte) or 'VP8X' (extended:
 * 24-bit canvas size minus one).
 * @param {Buffer} bytes - The decoded image.
 * @returns {object|null} { width, height }, or null when the header is not recognized.
 * @example
 * readWebpDimensions(bytes);
 */
function readWebpDimensions(bytes) {
  if (bytes.length < 30) {
    return null;
  }
  const chunk = bytes.toString('ascii', 12, 16);
  if (chunk === 'VP8 ') {
    // frame tag (3), start code 9d 01 2a (3), then width and height on 14 bits
    if (bytes[23] !== 0x9d || bytes[24] !== 0x01 || bytes[25] !== 0x2a) {
      return null;
    }
    // eslint-disable-next-line no-bitwise
    return { width: bytes.readUInt16LE(26) & 0x3fff, height: bytes.readUInt16LE(28) & 0x3fff };
  }
  if (chunk === 'VP8L') {
    if (bytes[20] !== 0x2f) {
      return null;
    }
    const bits = bytes.readUInt32LE(21);
    // eslint-disable-next-line no-bitwise
    return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
  }
  if (chunk === 'VP8X') {
    return { width: bytes.readUIntLE(24, 3) + 1, height: bytes.readUIntLE(27, 3) + 1 };
  }
  return null;
}

const DIMENSION_READERS = {
  'image/png': readPngDimensions,
  'image/jpeg': readJpegDimensions,
  'image/webp': readWebpDimensions,
};

/**
 * @description Validate an image returned by an integration over
 * widget.get-image (section 6 of capabilities/dashboard-widgets.md). The raw
 * base64 comes from unaudited code: the decoded bytes must be a PNG, a JPEG
 * or a WebP (magic numbers) under the size cap, whose header declares a
 * pixel size within the dimension bound — a small file can decode to a
 * gigantic bitmap in the browser; an unreadable header fails closed.
 * Returns a data URI served from the Gladys origin, re-encoded from the
 * decoded bytes so stray characters of the original base64 never reach the
 * browser. Throws one of WIDGET_IMAGE_ERRORS with a `details` sentence.
 * @param {any} rawBase64 - The data.image of the command-result (no data-URI prefix).
 * @returns {string} The validated image as a data URI.
 * @example
 * const image = normalizeWidgetImage('iVBORw0KGgo...');
 */
function normalizeWidgetImage(rawBase64) {
  if (typeof rawBase64 !== 'string' || rawBase64.length === 0) {
    throw imageError(WIDGET_IMAGE_ERRORS.INVALID, 'no image bytes in the command result');
  }
  if (rawBase64.length > MAX_BASE64_LENGTH) {
    // refused before the decode allocates: the size is the lower bound the
    // base64 length guarantees
    throw imageError(
      WIDGET_IMAGE_ERRORS.TOO_LARGE,
      `at least ${toKb((rawBase64.length * 3) / 4)} received, ${MAX_WIDGET_IMAGE_KB} KB allowed`,
    );
  }
  const bytes = Buffer.from(rawBase64, 'base64');
  if (bytes.length === 0) {
    throw imageError(WIDGET_IMAGE_ERRORS.INVALID, 'the image is not valid base64');
  }
  if (bytes.length > MAX_WIDGET_IMAGE_BYTES) {
    throw imageError(
      WIDGET_IMAGE_ERRORS.TOO_LARGE,
      `${toKb(bytes.length)} received, ${MAX_WIDGET_IMAGE_KB} KB allowed — resize the image integration-side`,
    );
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
    throw imageError(WIDGET_IMAGE_ERRORS.UNSUPPORTED_FORMAT, 'not a PNG, JPEG or WebP (magic numbers)');
  }
  const dimensions = DIMENSION_READERS[mimeType](bytes);
  if (dimensions === null) {
    throw imageError(WIDGET_IMAGE_ERRORS.DIMENSIONS_EXCEEDED, `unreadable ${mimeType} header, pixel size unknown`);
  }
  if (
    dimensions.width < 1 ||
    dimensions.height < 1 ||
    dimensions.width > MAX_WIDGET_IMAGE_DIMENSION ||
    dimensions.height > MAX_WIDGET_IMAGE_DIMENSION
  ) {
    throw imageError(
      WIDGET_IMAGE_ERRORS.DIMENSIONS_EXCEEDED,
      `${dimensions.width}×${dimensions.height} px, at most ${MAX_WIDGET_IMAGE_DIMENSION}×${MAX_WIDGET_IMAGE_DIMENSION} allowed`,
    );
  }
  return `data:${mimeType};base64,${bytes.toString('base64')}`;
}

module.exports = {
  normalizeWidgetImage,
  WIDGET_IMAGE_ERRORS,
  WIDGET_IMAGE_ERROR_CODES,
};
