const URL_REGEX = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;
const MARKDOWN_LINK_REGEX = /\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/gi;

const TRAILING_PUNCTUATION = /[.,;:!?)}\]'"]+$/;

/**
 * @param {string} url - Raw URL from message text.
 * @returns {string} Normalized href.
 */
function getUrlHref(url) {
  return url.startsWith('www.') ? `https://${url}` : url;
}

/**
 * Display text for auto-detected URLs: origin + path only (query params such as UTM stay in href).
 *
 * @param {string} url - Raw URL from message text.
 * @returns {string} User-visible link label.
 */
function getUrlDisplayText(url) {
  const href = getUrlHref(url);
  try {
    const parsed = new URL(href);
    return `${parsed.origin}${parsed.pathname}`;
  } catch (e) {
    return url;
  }
}

/**
 * Linkify plain text segments (auto-detected URLs).
 *
 * @param {string} text - Plain text without markdown links.
 * @returns {Array<{ type: 'text' | 'link', content: string, href?: string }>}
 */
function linkifyPlainText(text) {
  if (!text) {
    return [];
  }

  const parts = [];
  let lastIndex = 0;
  const regex = new RegExp(URL_REGEX.source, 'gi');
  let match = regex.exec(text);

  while (match !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
    }

    let url = match[0];
    const trailing = url.match(TRAILING_PUNCTUATION);
    if (trailing) {
      url = url.slice(0, -trailing[0].length);
    }

    const href = getUrlHref(url);
    parts.push({ type: 'link', content: getUrlDisplayText(url), href });

    lastIndex = match.index + match[0].length;
    match = regex.exec(text);
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  return parts;
}

/**
 * Split message text into plain text and link segments for safe rendering.
 * Supports markdown links `[label](url)` and auto-detected URLs.
 * UTM/query params are kept in href but hidden from the visible link label.
 *
 * @param {string} text - Raw message text.
 * @returns {Array<{ type: 'text' | 'link', content: string, href?: string }>}
 */
export function linkifyMessageText(text) {
  if (!text) {
    return [{ type: 'text', content: '' }];
  }

  const parts = [];
  let lastIndex = 0;
  const markdownRegex = new RegExp(MARKDOWN_LINK_REGEX.source, 'gi');
  let match = markdownRegex.exec(text);

  while (match !== null) {
    if (match.index > lastIndex) {
      parts.push(...linkifyPlainText(text.slice(lastIndex, match.index)));
    }

    parts.push({
      type: 'link',
      content: match[1],
      href: match[2]
    });

    lastIndex = match.index + match[0].length;
    match = markdownRegex.exec(text);
  }

  if (lastIndex < text.length) {
    parts.push(...linkifyPlainText(text.slice(lastIndex)));
  }

  if (parts.length === 0) {
    return linkifyPlainText(text);
  }

  return parts;
}
