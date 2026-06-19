const axios = require('axios');
const { isIP } = require('net');

const REQUEST_TIMEOUT_MS = 15_000;
const MAX_RESPONSE_BYTES = 512 * 1024;
const MAX_TEXT_CHARS = 12_000;
const MAX_REDIRECTS = 3;

const BLOCKED_HOSTNAMES = new Set(['localhost']);

/**
 * @description Check whether an IP address belongs to a private or local network.
 * @param {string} ip - IPv4 or IPv6 address.
 * @returns {boolean} True when the address must be blocked.
 * @example
 * isPrivateOrLocalIp('127.0.0.1');
 */
function isPrivateOrLocalIp(ip) {
  if (!isIP(ip)) {
    return false;
  }

  if (isIP(ip) === 6) {
    const normalized = ip.toLowerCase();
    if (normalized === '::1') {
      return true;
    }
    if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
      return true;
    }
    if (normalized.startsWith('fe80')) {
      return true;
    }
    return false;
  }

  const parts = ip.split('.').map((part) => Number(part));
  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0) {
    return true;
  }
  if (a === 172 && b >= 16 && b <= 31) {
    return true;
  }
  if (a === 192 && b === 168) {
    return true;
  }
  if (a === 169 && b === 254) {
    return true;
  }

  return false;
}

/**
 * @description Strip HTML tags and collapse whitespace for model consumption.
 * @param {string} html - Raw HTML document.
 * @returns {string} Plain text content.
 * @example
 * htmlToText('<p>Pool <strong>open</strong></p>');
 */
function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr|td|th)>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();
}

/**
 * @description Truncate text to a maximum length.
 * @param {string} text - Input text.
 * @param {number} maxChars - Maximum number of characters.
 * @returns {string} Truncated text.
 * @example
 * truncateText('abcdef', 3);
 */
function truncateText(text, maxChars) {
  if (!text || text.length <= maxChars) {
    return text || '';
  }
  return `${text.slice(0, maxChars)}... (truncated)`;
}

/**
 * @description Validate that a URL targets a public HTTP(S) endpoint.
 * @param {string} urlString - URL to validate.
 * @returns {Promise<URL>} Parsed URL.
 * @example
 * await assertPublicUrl('https://example.com');
 */
async function assertPublicUrl(urlString) {
  let url;
  try {
    url = new URL(urlString);
  } catch (e) {
    throw new Error(`Invalid URL: ${e.message}`);
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Only HTTP and HTTPS URLs are allowed');
  }

  if (url.username || url.password) {
    throw new Error('URLs with credentials are not allowed');
  }

  const hostname = url.hostname.toLowerCase();
  if (BLOCKED_HOSTNAMES.has(hostname) || hostname.endsWith('.localhost')) {
    throw new Error('Requests to local addresses are not allowed');
  }

  if (isPrivateOrLocalIp(hostname.replace(/^\[|\]$/g, ''))) {
    throw new Error('Requests to private or local network addresses are not allowed');
  }

  const addresses = await require('dns').promises.lookup(hostname, { all: true });
  if (addresses.some(({ address }) => isPrivateOrLocalIp(address))) {
    throw new Error('Requests to private or local network addresses are not allowed');
  }

  return url;
}

/**
 * @description Fetch a public web page and return readable text content.
 * @param {object} params - Request parameters.
 * @param {string} params.url - Public HTTP(S) URL to fetch.
 * @returns {Promise<string>} Page text content.
 * @example
 * await fetchWebPage({ url: 'https://example.com' });
 */
async function fetchWebPage({ url }) {
  let currentUrl = await assertPublicUrl(url);
  let redirectCount = 0;
  let keepFetching = true;

  while (keepFetching) {
    let response;
    try {
      // eslint-disable-next-line no-await-in-loop
      response = await axios.get(currentUrl.toString(), {
        maxRedirects: 0,
        validateStatus: () => true,
        timeout: REQUEST_TIMEOUT_MS,
        responseType: 'arraybuffer',
        maxContentLength: MAX_RESPONSE_BYTES,
        maxBodyLength: MAX_RESPONSE_BYTES,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml,text/plain,application/json;q=0.9,*/*;q=0.8',
        },
      });
    } catch (e) {
      if (e?.code === 'ECONNABORTED') {
        throw new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms`);
      }
      if (e?.message?.includes('maxContentLength')) {
        throw new Error(`Response too large (>${MAX_RESPONSE_BYTES} bytes)`);
      }
      throw e;
    }

    if (response.status >= 300 && response.status < 400) {
      const { location } = response.headers;
      if (!location) {
        throw new Error(`Redirect response without Location header (${response.status})`);
      }

      redirectCount += 1;
      if (redirectCount > MAX_REDIRECTS) {
        throw new Error('Too many redirects');
      }

      // eslint-disable-next-line no-await-in-loop
      currentUrl = await assertPublicUrl(new URL(location, currentUrl).toString());
      // eslint-disable-next-line no-continue
      continue;
    }

    if (response.status < 200 || response.status >= 300) {
      throw new Error(`HTTP ${response.status} ${response.statusText || ''}`.trim());
    }

    const body = Buffer.from(response.data).toString('utf-8');
    const contentType = response.headers['content-type'] || '';

    let text;
    if (contentType.includes('text/html') || body.trim().startsWith('<')) {
      text = htmlToText(body);
    } else {
      text = body.trim();
    }

    keepFetching = false;
    return truncateText(text, MAX_TEXT_CHARS);
  }

  throw new Error('Unable to fetch web page');
}

module.exports = {
  fetchWebPage,
  htmlToText,
  isPrivateOrLocalIp,
  assertPublicUrl,
};
