// The AI answers in Markdown ("**27 °C**", bullet lists, `code`…), but Telegram
// only understands a small HTML subset (b, i, u, s, a, code, pre, blockquote).
// This converts the Markdown we actually receive into that subset: what Telegram
// supports becomes a tag, what it does not (headings, lists, tables) is degraded
// to something readable in plain text instead of leaking its syntax.
// See https://core.telegram.org/bots/api#html-style

const PLACEHOLDER_START = '\u0000';
const PLACEHOLDER_END = '\u0001';
const PLACEHOLDER_REGEX = /\u0000(\d+)\u0001/g;

const FENCED_CODE_REGEX = /```([a-zA-Z0-9_+#-]*)[ \t]*\n?([\s\S]*?)```/g;
const INLINE_CODE_REGEX = /`([^`\n]+)`/g;
// the optional trailing part is the Markdown link title: `[label](url "title")`
const IMAGE_REGEX = /!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+[^)]*)?\)/g;
const LINK_REGEX = /\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+[^)]*)?\)/g;
const SAFE_URL_REGEX = /^(?:https?:\/\/|tg:\/\/)/i;
const HORIZONTAL_RULE_REGEX = /^ {0,3}([-*_])[ \t]*(?:\1[ \t]*){2,}$/;
const TABLE_SEPARATOR_REGEX = /^[\s|]*:?-{1,}:?[\s|:-]*$/;
const HEADING_REGEX = /^ {0,3}(#{1,6})\s+(.*?)\s*#*\s*$/;
const BLOCKQUOTE_REGEX = /^ {0,3}>\s?(.*)$/;
const UNORDERED_LIST_REGEX = /^(\s*)[-*+]\s+(.*)$/;
const ORDERED_LIST_REGEX = /^(\s*)(\d{1,3})[.)]\s+(.*)$/;

const HTML_ESCAPES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
};

/**
 * @description Escape the characters Telegram reserves in HTML mode.
 * @param {string} text - Raw text.
 * @returns {string} HTML-escaped text.
 * @example
 * escapeHtml('a & b'); // 'a &amp; b'
 */
function escapeHtml(text) {
  return text.replace(/[&<>"]/g, (character) => HTML_ESCAPES[character]);
}

/**
 * @description Store an already built HTML chunk and return its placeholder, so
 * that the Markdown rules below never rewrite the inside of a code block.
 * @param {Array<string>} placeholders - Accumulator of the extracted chunks.
 * @param {string} html - The HTML chunk to protect.
 * @returns {string} The placeholder to insert in the text.
 * @example
 * storePlaceholder([], '<code>a</code>');
 */
function storePlaceholder(placeholders, html) {
  placeholders.push(html);
  return `${PLACEHOLDER_START}${placeholders.length - 1}${PLACEHOLDER_END}`;
}

/**
 * @description Convert the inline Markdown of one line (links, bold, italic,
 * strikethrough) to Telegram HTML. The text is escaped first: after that, the
 * only angle brackets left are the tags this function generates.
 * @param {string} line - One line of Markdown, without code spans.
 * @returns {string} Telegram HTML.
 * @example
 * convertInline('It is **27 °C**'); // 'It is <b>27 °C</b>'
 */
function convertInline(line) {
  let html = escapeHtml(line);
  // Telegram cannot display an inline image: keep the alt text only
  html = html.replace(IMAGE_REGEX, (match, alt) => alt);
  html = html.replace(LINK_REGEX, (match, label, url) => {
    if (!SAFE_URL_REGEX.test(url)) {
      return match;
    }
    return `<a href="${url}">${label || url}</a>`;
  });
  html = html.replace(/\*\*([^\n]+?)\*\*/g, '<b>$1</b>');
  html = html.replace(/__([^\n]+?)__/g, '<b>$1</b>');
  html = html.replace(/~~([^\n]+?)~~/g, '<s>$1</s>');
  // a single * or _ is emphasis only when it is not glued to a word, so that
  // snake_case identifiers and a * used as a bullet are left alone
  html = html.replace(/(^|[^*\w])\*([^*\n]+?)\*(?![*\w])/g, '$1<i>$2</i>');
  html = html.replace(/(^|[^_\w])_([^_\n]+?)_(?![_\w])/g, '$1<i>$2</i>');
  return html;
}

/**
 * @description Convert a Markdown answer to the HTML subset supported by Telegram.
 * @param {string} markdown - The Markdown text, typically written by the AI.
 * @returns {string} Text ready to be sent with parse_mode HTML.
 * @example
 * markdownToTelegramHtml('The temperature is **27 °C**.');
 */
function markdownToTelegramHtml(markdown) {
  if (typeof markdown !== 'string' || markdown.length === 0) {
    return markdown;
  }

  const placeholders = [];
  let text = markdown
    .replace(/\r\n/g, '\n')
    .split(PLACEHOLDER_START)
    .join('')
    .split(PLACEHOLDER_END)
    .join('');

  // code first: nothing inside a code block is Markdown
  text = text.replace(FENCED_CODE_REGEX, (match, language, code) => {
    const openingTag = language ? `<pre><code class="language-${language}">` : '<pre>';
    const closingTag = language ? '</code></pre>' : '</pre>';
    return storePlaceholder(placeholders, `${openingTag}${escapeHtml(code.replace(/\n$/, ''))}${closingTag}`);
  });
  text = text.replace(INLINE_CODE_REGEX, (match, code) =>
    storePlaceholder(placeholders, `<code>${escapeHtml(code)}</code>`),
  );

  const convertedLines = [];
  let quotedLines = null;

  const flushBlockquote = () => {
    if (quotedLines !== null) {
      convertedLines.push(`<blockquote>${quotedLines.join('\n')}</blockquote>`);
      quotedLines = null;
    }
  };

  text.split('\n').forEach((line) => {
    const blockquote = BLOCKQUOTE_REGEX.exec(line);
    if (blockquote) {
      quotedLines = quotedLines || [];
      quotedLines.push(convertInline(blockquote[1]));
      return;
    }
    flushBlockquote();

    if (HORIZONTAL_RULE_REGEX.test(line)) {
      // Telegram has no <hr>: an empty line keeps the visual separation
      convertedLines.push('');
      return;
    }
    if (line.includes('|') && TABLE_SEPARATOR_REGEX.test(line)) {
      // the |---|---| row of a table is pure syntax, drop it
      return;
    }
    const heading = HEADING_REGEX.exec(line);
    if (heading) {
      convertedLines.push(`<b>${convertInline(heading[2])}</b>`);
      return;
    }
    const unorderedItem = UNORDERED_LIST_REGEX.exec(line);
    if (unorderedItem) {
      convertedLines.push(`${unorderedItem[1]}• ${convertInline(unorderedItem[2])}`);
      return;
    }
    const orderedItem = ORDERED_LIST_REGEX.exec(line);
    if (orderedItem) {
      convertedLines.push(`${orderedItem[1]}${orderedItem[2]}. ${convertInline(orderedItem[3])}`);
      return;
    }
    convertedLines.push(convertInline(line));
  });

  flushBlockquote();

  return convertedLines
    .join('\n')
    .replace(PLACEHOLDER_REGEX, (match, index) => placeholders[Number(index)])
    .trim();
}

module.exports = {
  markdownToTelegramHtml,
};
