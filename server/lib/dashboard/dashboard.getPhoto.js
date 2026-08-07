const dns = require('dns');
const net = require('net');
const http = require('http');
const https = require('https');
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
 * @description Convert an IPv4-mapped IPv6 address to its dotted IPv4 form.
 * Both notations are handled: ::ffff:127.0.0.1 and the hexadecimal form ::ffff:7f00:1,
 * which is what the URL parser produces.
 * @param {string} address - Lowercased IPv6 address.
 * @returns {string|null} The IPv4 address, or null when it is not an IPv4-mapped address.
 * @example
 * toIpv4Mapped('::ffff:7f00:1');
 */
function toIpv4Mapped(address) {
  const match = /^::ffff:(.+)$/.exec(address);

  if (match === null) {
    return null;
  }

  const rest = match[1];

  if (net.isIPv4(rest)) {
    return rest;
  }

  const groups = rest.split(':');

  if (groups.length > 2 || groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) {
    return null;
  }

  const [high, low] = groups.length === 2 ? groups : ['0', groups[0]];
  // eslint-disable-next-line no-bitwise
  const bytes = [parseInt(high, 16) >> 8, parseInt(high, 16) & 0xff, parseInt(low, 16) >> 8, parseInt(low, 16) & 0xff];
  return bytes.join('.');
}

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
  const lowerCased = ip.toLowerCase();
  const address = toIpv4Mapped(lowerCased) || lowerCased;

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
 * @returns {Promise<Array|null>} The validated addresses, or null when the host is already an IP literal.
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
    // No DNS resolution happens for an IP literal, there is nothing to pin.
    return null;
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

  return addresses;
}

/**
 * @description Build a dns.lookup replacement that always answers with the addresses already
 * validated by assertHostIsAllowed. Without it the hostname would be resolved a second time when
 * the socket connects, and an attacker-controlled domain could rebind to a restricted address
 * in between (DNS rebinding).
 * @param {Array} addresses - Validated addresses, as returned by dns.promises.lookup with all: true.
 * @returns {Function} A lookup function compatible with net.connect.
 * @example
 * createPinnedLookup([{ address: '203.0.113.10', family: 4 }]);
 */
function createPinnedLookup(addresses) {
  return (hostname, options, callback) => {
    const lookupOptions = typeof options === 'number' ? { family: options } : options || {};
    const matching = lookupOptions.family
      ? addresses.filter(({ family }) => family === lookupOptions.family)
      : addresses;

    if (matching.length === 0) {
      callback(new BadParameters('Photo URL points to a restricted address'));
      return;
    }

    if (lookupOptions.all) {
      callback(null, matching);
      return;
    }

    callback(null, matching[0].address, matching[0].family);
  };
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

  const validatedAddresses = await assertHostIsAllowed(parsedUrl);
  const agentOptions = validatedAddresses ? { lookup: createPinnedLookup(validatedAddresses) } : {};

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
    // The socket connects to the address we validated, not to a freshly resolved one.
    httpAgent: new http.Agent(agentOptions),
    httpsAgent: new https.Agent(agentOptions),
    // A proxy would resolve the hostname itself and defeat the address validation.
    proxy: false,
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
  createPinnedLookup,
  isRestrictedAddress,
};
