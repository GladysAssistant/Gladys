// Minimal image fixtures for the dashboard widget image tests: valid magic
// numbers AND a real header declaring the pixel size, since the core reads
// the dimensions before serving anything.

/**
 * @description Build a PNG signature + IHDR chunk declaring a size.
 * @param {number} [width] - Pixel width.
 * @param {number} [height] - Pixel height.
 * @returns {Buffer} The bytes.
 * @example
 * const png = buildPng(16, 16);
 */
function buildPng(width = 16, height = 16) {
  const header = Buffer.alloc(24);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(header, 0);
  header.writeUInt32BE(13, 8);
  header.write('IHDR', 12, 'ascii');
  header.writeUInt32BE(width, 16);
  header.writeUInt32BE(height, 20);
  return Buffer.concat([header, Buffer.alloc(16, 1)]);
}

/**
 * @description Build a JPEG with an APP0 segment then a SOF0 frame header.
 * @param {number} [width] - Pixel width.
 * @param {number} [height] - Pixel height.
 * @returns {Buffer} The bytes.
 * @example
 * const jpeg = buildJpeg(16, 16);
 */
function buildJpeg(width = 16, height = 16) {
  const app0 = Buffer.from([0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 1, 1, 0, 0, 1, 0, 1, 0, 0]);
  const sof0 = Buffer.alloc(19);
  sof0[0] = 0xff;
  sof0[1] = 0xc0;
  sof0.writeUInt16BE(17, 2);
  sof0[4] = 8;
  sof0.writeUInt16BE(height, 5);
  sof0.writeUInt16BE(width, 7);
  sof0[9] = 3;
  return Buffer.concat([Buffer.from([0xff, 0xd8]), app0, sof0, Buffer.alloc(16, 1)]);
}

/**
 * @description Build a lossy WebP ('VP8 ' chunk) declaring a size.
 * @param {number} [width] - Pixel width.
 * @param {number} [height] - Pixel height.
 * @returns {Buffer} The bytes.
 * @example
 * const webp = buildWebp(16, 16);
 */
function buildWebp(width = 16, height = 16) {
  const bytes = Buffer.alloc(40);
  bytes.write('RIFF', 0, 'ascii');
  bytes.writeUInt32LE(32, 4);
  bytes.write('WEBP', 8, 'ascii');
  bytes.write('VP8 ', 12, 'ascii');
  bytes.writeUInt32LE(20, 16);
  // frame tag (3 bytes), then the start code
  bytes[23] = 0x9d;
  bytes[24] = 0x01;
  bytes[25] = 0x2a;
  bytes.writeUInt16LE(width, 26);
  bytes.writeUInt16LE(height, 28);
  return bytes;
}

/**
 * @description Build a lossless WebP ('VP8L' chunk) declaring a size.
 * @param {number} [width] - Pixel width.
 * @param {number} [height] - Pixel height.
 * @returns {Buffer} The bytes.
 * @example
 * const webp = buildWebpLossless(16, 16);
 */
function buildWebpLossless(width = 16, height = 16) {
  const bytes = Buffer.alloc(40);
  bytes.write('RIFF', 0, 'ascii');
  bytes.writeUInt32LE(32, 4);
  bytes.write('WEBP', 8, 'ascii');
  bytes.write('VP8L', 12, 'ascii');
  bytes.writeUInt32LE(20, 16);
  bytes[20] = 0x2f;
  // eslint-disable-next-line no-bitwise
  bytes.writeUInt32LE((width - 1) | ((height - 1) << 14), 21);
  return bytes;
}

/**
 * @description Build an extended WebP ('VP8X' chunk) declaring a canvas size.
 * @param {number} [width] - Pixel width.
 * @param {number} [height] - Pixel height.
 * @returns {Buffer} The bytes.
 * @example
 * const webp = buildWebpExtended(16, 16);
 */
function buildWebpExtended(width = 16, height = 16) {
  const bytes = Buffer.alloc(40);
  bytes.write('RIFF', 0, 'ascii');
  bytes.writeUInt32LE(32, 4);
  bytes.write('WEBP', 8, 'ascii');
  bytes.write('VP8X', 12, 'ascii');
  bytes.writeUInt32LE(10, 16);
  bytes.writeUIntLE(width - 1, 24, 3);
  bytes.writeUIntLE(height - 1, 27, 3);
  return bytes;
}

module.exports = {
  buildPng,
  buildJpeg,
  buildWebp,
  buildWebpLossless,
  buildWebpExtended,
};
