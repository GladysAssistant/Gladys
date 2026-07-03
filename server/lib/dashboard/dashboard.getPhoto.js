const axios = require('axios');
const { BadParameters } = require('../../utils/coreErrors');

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/bmp',
]);

/**
 * @description Fetch an external image and return it as a data URI.
 * The request is made by the Gladys server so local NAS URLs remain reachable remotely via Gladys Plus.
 * @param {string} url - HTTP or HTTPS image URL.
 * @returns {Promise<string>} Image as a data URI (e.g. image/jpeg;base64,...).
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
    maxContentLength: MAX_IMAGE_BYTES,
    maxBodyLength: MAX_IMAGE_BYTES,
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

  return `${contentType};base64,${imageBuffer.toString('base64')}`;
}

module.exports = {
  getPhoto,
};
