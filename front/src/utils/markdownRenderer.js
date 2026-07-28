import { getUrlDisplayText } from './linkifyMessageText';

// The AI answers in Markdown ("**27 °C**", bullet lists, `code`…). marked and
// DOMPurify are downloaded on the first message to render, not in the main
// bundle, and the built renderer is kept here so the next messages are
// formatted right away on their first paint.
let renderer = null;
let loadingPromise = null;

/**
 * @param {Function} Marked - The marked class.
 * @param {object} DOMPurify - The DOMPurify instance.
 * @returns {Function} A function turning markdown into sanitized HTML.
 */
function buildRenderer(Marked, DOMPurify) {
  // own instance: the global marked options are shared with the rest of the app
  const marked = new Marked({ gfm: true, breaks: true });

  return text => {
    const template = document.createElement('template');
    template.innerHTML = DOMPurify.sanitize(marked.parse(text), { USE_PROFILES: { html: true } });
    template.content.querySelectorAll('a[href]').forEach(link => {
      const href = link.getAttribute('href');
      const label = link.textContent;
      // an auto-linked URL keeps a short label (query params such as UTM stay
      // in the href), like in the plain text renderer
      if (label === href || `https://${label}` === href) {
        link.textContent = getUrlDisplayText(label);
      }
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });
    template.content.querySelectorAll('table').forEach(table => {
      table.setAttribute('class', 'table table-sm');
    });
    return template.innerHTML;
  };
}

/**
 * @description Get the markdown renderer if it was already downloaded.
 * @returns {Function|null} The renderer, or null if it is not loaded yet.
 * @example
 * const render = getMarkdownRenderer();
 */
export function getMarkdownRenderer() {
  return renderer;
}

/**
 * @description Download the markdown renderer (once for the whole app).
 * @returns {Promise<Function>} Resolve with the renderer.
 * @example
 * const render = await loadMarkdownRenderer();
 */
export function loadMarkdownRenderer() {
  if (renderer) {
    return Promise.resolve(renderer);
  }
  if (!loadingPromise) {
    loadingPromise = Promise.all([import('marked'), import('dompurify')])
      .then(([markedModule, dompurifyModule]) => {
        renderer = buildRenderer(markedModule.Marked, dompurifyModule.default);
        return renderer;
      })
      .catch(e => {
        // a chunk that failed to download (offline, deploy in progress) must
        // not disable the markdown for the whole session: forget the failed
        // attempt so the next message retries
        loadingPromise = null;
        throw e;
      });
  }
  return loadingPromise;
}
