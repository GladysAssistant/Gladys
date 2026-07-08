const axios = require('axios');
const { BadParameters } = require('../../utils/coreErrors');
const { resizeImageBuffer } = require('../../utils/resizeImage');

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_SOURCE_IMAGE_BYTES = 25 * 1024 * 1024;
const DASHBOARD_PHOTO_MAX_WIDTH = 800;
const DASHBOARD_PHOTO_MAX_HEIGHT = 400;
const DASHBOARD_PHOTO_JPEG_QUALITY = 80;
const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/bmp',
  'application/octet-stream',
]);

/**
 * @description Fetch an external image, resize it for the dashboard widget, and return a JPEG data URI.
 * The request is made by the Gladys server so local NAS URLs remain reachable remotely via Gladys Plus.
 * @param {string} url - HTTP or HTTPS image URL.
 * @returns {Promise<string>} Image as a JPEG data URI (image/jpeg;base64,...).
 * @example
 * dashboard.getPhoto('http://192.168.1.10/photos/vacation.jpg');
 */
async function getPhoto(url) {
  let parsedUrl;

  try {
    parsedUrl = new URL(url);
  } catch (e) {
    throw new BadParameters('Invalid photo URL');
  }

  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new BadParameters('Photo URL must use HTTP or HTTPS');
  }

  const response = await axios({
    url: parsedUrl.toString(),
    method: 'get',
    responseType: 'arraybuffer',
    timeout: REQUEST_TIMEOUT_MS,
    maxContentLength: MAX_SOURCE_IMAGE_BYTES,
    maxBodyLength: MAX_SOURCE_IMAGE_BYTES,
    validateStatus: (status) => status >= 200 && status < 300,
  });

  const contentType = (response.headers['content-type'] || 'image/jpeg')
    .split(';')[0]
    .trim()
    .toLowerCase();

  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw new BadParameters('URL does not point to a supported image');
  }

  const imageBuffer = Buffer.from(response.data);

  try {
    return await resizeImageBuffer(imageBuffer, {
      maxWidth: DASHBOARD_PHOTO_MAX_WIDTH,
      maxHeight: DASHBOARD_PHOTO_MAX_HEIGHT,
      quality: DASHBOARD_PHOTO_JPEG_QUALITY,
    });
  } catch (e) {
    throw new BadParameters('URL does not point to a supported image');
  }
}

module.exports = {
  getPhoto,
};
