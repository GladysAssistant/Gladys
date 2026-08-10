const axios = require('axios');

const { NotFoundError } = require('../../../utils/coreErrors');
const { STORE_HTTP_TIMEOUT_MS, MAX_DOCS_MARKDOWN_BYTES } = require('./store.constants');

/**
 * @description Download the re-hosted documentation markdown of a store
 * integration, so the frontend can render it in place instead of sending
 * the user to a raw .md file. The URL is always resolved from the store
 * index (never taken from the client): this must not become an open proxy.
 * Falls back on the English doc when the requested language has none.
 * @param {string} storeSlug - The store slug (owner/repo).
 * @param {string} [lang] - The preferred documentation language.
 * @returns {Promise<object>} Resolve with { store_slug, url, content }.
 * @example
 * const docs = await gladys.externalIntegration.getDocsMarkdown('john/gladys-open-meteo-demo', 'fr');
 */
async function getDocsMarkdown(storeSlug, lang) {
  const index = await this.getIndex();
  const entries = (index && index.integrations) || [];
  const entry = entries.find((candidate) => candidate.store_slug === storeSlug);
  const docs = (entry && entry.docs) || {};
  const url = docs[lang] || docs.en;
  if (!url) {
    throw new NotFoundError('DOCS_NOT_FOUND');
  }
  const { data } = await axios.get(url, {
    timeout: STORE_HTTP_TIMEOUT_MS,
    maxContentLength: MAX_DOCS_MARKDOWN_BYTES,
    responseType: 'text',
    // axios parses JSON-looking bodies by default: keep the raw text
    transformResponse: [(raw) => raw],
  });
  return { store_slug: storeSlug, url, content: data };
}

module.exports = {
  getDocsMarkdown,
};
