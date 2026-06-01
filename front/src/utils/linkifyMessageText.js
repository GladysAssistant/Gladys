const URL_REGEX = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;

const TRAILING_PUNCTUATION = /[.,;:!?)}\]'"]+$/;

/**
 * Split message text into plain text and link segments for safe rendering.
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

    const href = url.startsWith('www.') ? `https://${url}` : url;
    parts.push({ type: 'link', content: url, href });

    lastIndex = match.index + match[0].length;
    match = regex.exec(text);
  }

  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) });
  }

  if (parts.length === 0) {
    return [{ type: 'text', content: text }];
  }

  return parts;
}
