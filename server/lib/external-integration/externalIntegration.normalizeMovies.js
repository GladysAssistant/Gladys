const { ExternalIntegrationUnavailableError } = require('../../utils/coreErrors');
const { MAX_MOVIES } = require('./constants');

const MAX_STRING_LENGTH = 2000;

/**
 * @description Coerce a value to a bounded, trimmed non-empty string.
 * @param {any} value - The value to coerce.
 * @returns {string|null} The trimmed string, or null when not a non-empty string.
 * @example
 * toBoundedString('  Some title  ');
 */
function toBoundedString(value) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed.substring(0, MAX_STRING_LENGTH);
}

/**
 * @description Coerce a value to a valid Date.
 * @param {any} value - An ISO string, a timestamp or a Date.
 * @returns {Date|null} The date, or null when invalid.
 * @example
 * toValidDate('2026-08-01T12:00:00.000Z');
 */
function toValidDate(value) {
  if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) {
    return null;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

// the optional string fields of the pivot movies format, copied when
// present and valid, silently dropped otherwise
const OPTIONAL_STRING_FIELDS = ['overview', 'posterUrl', 'trailerUrl', 'sourceUrl'];

/**
 * @description Normalize and bound one movie entry. Returns null when a
 * required field is missing or invalid, so the caller can drop the entry
 * without rejecting the whole list.
 * @param {object} rawMovie - One entry of the raw payload.
 * @returns {object|null} The normalized pivot movie, or null.
 * @example
 * const movie = normalizeMovie({ id: 42, title: 'A movie', releaseDate: '2026-08-01' });
 */
function normalizeMovie(rawMovie) {
  if (rawMovie === null || typeof rawMovie !== 'object') {
    return null;
  }
  const id = typeof rawMovie.id === 'string' || typeof rawMovie.id === 'number' ? String(rawMovie.id) : null;
  const title = toBoundedString(rawMovie.title);
  const releaseDate = toValidDate(rawMovie.releaseDate);
  if (id === null || title === null || releaseDate === null) {
    return null;
  }
  const movie = { id, title, releaseDate };
  OPTIONAL_STRING_FIELDS.forEach((field) => {
    const value = toBoundedString(rawMovie[field]);
    if (value !== null) {
      movie[field] = value;
    }
  });
  return movie;
}

/**
 * @description Normalize and bound the movies payload returned by a
 * "movies" external integration. The payload comes from unaudited code:
 * every field is whitelisted (anything unknown is dropped), the array is
 * capped, and an entry missing a required field is dropped rather than
 * rejecting the whole list. A payload that isn't an array fails like a
 * timeout, so the generic provider loop of lib/premieres falls through to
 * the next provider.
 * @param {Array} payload - The `data.movies` of the command-result.
 * @returns {Array<object>} The normalized pivot movies list.
 * @example
 * const movies = normalizeMovies([{ id: 42, title: 'A movie', releaseDate: '2026-08-01' }]);
 */
function normalizeMovies(payload) {
  if (!Array.isArray(payload)) {
    throw new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_INVALID_MOVIES');
  }
  return payload
    .slice(0, MAX_MOVIES)
    .map(normalizeMovie)
    .filter((movie) => movie !== null);
}

module.exports = {
  normalizeMovies,
};
