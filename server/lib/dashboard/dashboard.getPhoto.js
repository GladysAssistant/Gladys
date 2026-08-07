const dns = require('dns');
const net = require('net');
const axios = require('axios');
const { BadParameters } = require('../../utils/coreErrors');
const { resizeImageBuffer } = require('../../utils/resizeImage');

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_SOURCE_IMAGE_BYTES = 25 * 1024 * 1024;
const DASHBOARD_PHOTO_MAX_WIDTH = 800;
const DASHBOARD_PHOTO_MAX_HEIGHT = 400;
const DASHBOARD_PHOTO_JPEG_QUALITY = 80;
// Only explicit image MIME types are accepted. application/octet-stream is voluntarily excluded:
// a lot of internal endpoints answer with it, which would turn this proxy into a blind network scanner.
const ALLOWED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/avif',
  'image/bmp',
]);

/**
 * @description Tell if an IP address must never be reached by the photo proxy.
 * Loopback, link-local (including the cloud metadata endpoint 169.254.169.254) and unspecified
 * addresses are blocked. RFC1918 LAN ranges stay allowed on purpose: the whole point of this proxy
 * is to display photos hosted on a local NAS, including remotely through Gladys Plus.
 * @param {string} ip - IPv4 or IPv6 address.
 * @returns {boolean} True if the address is restricted.
 * @example
 * isRestrictedAddress('169.254.169.254');
 */
function isRestrictedAddress(ip) {
  const family = net.isIP(ip);

  if (family === 0) {
    return true;
  }

  // Normalize IPv4-mapped IPv6 addresses (::ffff:127.0.0.1) so they go through the IPv4 rules.
  let address = ip.toLowerCase();
  const ipv4MappedPrefix = '::ffff:';
  if (address.startsWith(ipv4MappedPrefix) && net.isIPv4(address.slice(ipv4MappedPrefix.length))) {
    address = address.slice(ipv4MappedPrefix.length);
  }

  if (net.isIPv4(address)) {
    const bytes = address.split('.').map(Number);
    // 127.0.0.0/8 (loopback), 169.254.0.0/16 (link-local & cloud metadata), 0.0.0.0/8 (unspecified)
    return bytes[0] === 127 || (bytes[0] === 169 && bytes[1] === 254) || bytes[0] === 0;
  }

  // ::1 (loopback), :: (unspecified), fe80::/10 (link-local)
  return address === '::1' || address === '::' || /^fe[89ab]/.test(address);
}

/**
 * @description Resolve the URL hostname and make sure it does not point to a restricted address.
 * @param {URL} parsedUrl - Photo URL.
 * @returns {Promise<void>} Resolves when the target is allowed.
 * @example
 * await assertHostIsAllowed(new URL('http://192.168.1.10/photo.jpg'));
 */
async function assertHostIsAllowed(parsedUrl) {
  // URL keeps IPv6 literals wrapped in brackets, dns/net do not want them.
  const hostname = parsedUrl.hostname.replace(/^\[|\]$/g, '');

  if (net.isIP(hostname) !== 0) {
    if (isRestrictedAddress(hostname)) {
      throw new BadParameters('Photo URL points to a restricted address');
    }
    return;
  }

  let addresses;
  try {
    addresses = await dns.promises.lookup(hostname, { all: true });
  } catch (e) {
    throw new BadParameters('Photo URL hostname could not be resolved');
  }

  const restricted = addresses.some(({ address }) => isRestrictedAddress(address));
  if (restricted) {
    throw new BadParameters('Photo URL points to a restricted address');
  }
}

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

  await assertHostIsAllowed(parsedUrl);

  const response = await axios({
    url: parsedUrl.toString(),
    method: 'get',
    responseType: 'arraybuffer',
    timeout: REQUEST_TIMEOUT_MS,
    maxContentLength: MAX_SOURCE_IMAGE_BYTES,
    maxBodyLength: MAX_SOURCE_IMAGE_BYTES,
    // Redirects are disabled: a public URL could otherwise 302 to a restricted address
    // after the host check above.
    maxRedirects: 0,
    validateStatus: (status) => status >= 200 && status < 300,
  });

  const contentType = (response.headers['content-type'] || '')
    .split(';')[0]
    .trim()
    .toLowerCase();

  // A missing Content-Type is rejected instead of being assumed to be an image,
  // otherwise the allowlist could simply be bypassed.
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
