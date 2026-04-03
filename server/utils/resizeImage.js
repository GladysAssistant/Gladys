const sharp = require('sharp');

// Default max dimensions for AI analysis (security cameras)
const DEFAULT_MAX_WIDTH = 640;
const DEFAULT_MAX_HEIGHT = 480;

/**
 * @description Resize a base64 image to reduce size for AI analysis.
 * @param {string} base64Image - Base64 encoded image (with or without data URI prefix).
 * @param {object} options - Resize options.
 * @param {number} [options.maxWidth=640] - Maximum width in pixels.
 * @param {number} [options.maxHeight=480] - Maximum height in pixels.
 * @param {number} [options.quality=80] - JPEG quality (1-100).
 * @returns {Promise<string>} Resized base64 image with data URI prefix.
 * @example
 * const resized = await resizeImage(base64Image, { maxWidth: 640, maxHeight: 480 });
 */
async function resizeImage(base64Image, options = {}) {
  const { maxWidth = DEFAULT_MAX_WIDTH, maxHeight = DEFAULT_MAX_HEIGHT, quality = 80 } = options;

  // Extract base64 data (remove data URI prefix if present)
  let base64Data = base64Image;

  if (base64Image.includes(',')) {
    [, base64Data] = base64Image.split(',');
  }

  // Convert base64 to buffer
  const inputBuffer = Buffer.from(base64Data, 'base64');

  // Resize image maintaining aspect ratio, convert to JPEG for smaller size
  const resizedBuffer = await sharp(inputBuffer)
    .resize(maxWidth, maxHeight, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .jpeg({ quality })
    .toBuffer();

  // Convert back to base64 with data URI prefix
  const resizedBase64 = resizedBuffer.toString('base64');
  return `data:image/jpeg;base64,${resizedBase64}`;
}

module.exports = {
  resizeImage,
  DEFAULT_MAX_WIDTH,
  DEFAULT_MAX_HEIGHT,
};
