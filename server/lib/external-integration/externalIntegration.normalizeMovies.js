const { ExternalIntegrationUnavailableError } = require('../../utils/coreErrors');
const { MAX_MOVIES, MAX_SHOWTIMES } = require('./constants');

const MAX_STRING_LENGTH = 2000;
const MAX_ID_LENGTH = 200;
const MAX_SHOWTIME_STRING_LENGTH = 100;

/**
 * @description Coerce a value to a bounded, trimmed non-empty string.
 * @param {any} value - The value to coerce.
 * @param {number} [maxLength] - The max length to bound to.
 * @returns {string|null} The trimmed string, or null when not a non-empty string.
 * @example
 * toBoundedString('  Some title  ');
 */
function toBoundedString(value, maxLength = MAX_STRING_LENGTH) {
  if (typeof value !== 'string') {
    return null;
  }
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed.substring(0, maxLength);
}

/**
 * @description Coerce a value to a bounded http(s) URL string. Any other
 * scheme (`javascript:`, `data:`, ...) is rejected: these fields render
 * unmodified as `img src` / `a href` on the dashboard, and the payload
 * comes from unaudited integration code.
 * @param {any} value - The value to coerce.
 * @returns {string|null} The bounded URL string, or null when invalid.
 * @example
 * toBoundedHttpUrl('https://example.com/poster.jpg');
 */
function toBoundedHttpUrl(value) {
  const bounded = toBoundedString(value);
  if (bounded === null) {
    return null;
  }
  let url;
  try {
    url = new URL(bounded);
  } catch (e) {
    return null;
  }
  return url.protocol === 'http:' || url.protocol === 'https:' ? bounded : null;
}

/**
 * @description Coerce a value to a bounded movie id: a non-empty string, or
 * a finite number coerced to string. Anything else (Infinity, NaN, an
 * object, an oversized string) is rejected.
 * @param {any} value - The value to coerce.
 * @returns {string|null} The bounded id string, or null when invalid.
 * @example
 * toBoundedId(42);
 */
function toBoundedId(value) {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : null;
  }
  if (typeof value !== 'string') {
    return null;
  }
  // an id is an identifier, not free text: truncating it (like a title or
  // an overview) would silently rewrite it into a different, possibly
  // colliding one, so an oversized value is rejected outright instead
  const trimmed = value.trim();
  return trimmed.length === 0 || trimmed.length > MAX_ID_LENGTH ? null : trimmed;
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
const OPTIONAL_STRING_FIELDS = ['overview'];
// the optional URL fields: rendered as img src / a href on the dashboard, so
// only http(s) is accepted (see toBoundedHttpUrl)
const OPTIONAL_URL_FIELDS = ['posterUrl', 'trailerUrl', 'sourceUrl'];

/**
 * @description Normalize and bound one showtime entry of `movie.showtimes`.
 * Deliberately small and generic (a time and an optional version label, e.g.
 * "VF"/"VOST"): a provider-specific session id, room or booking link is not
 * part of the pivot, matching the same "small, additive" philosophy as the
 * rest of the movies format.
 * @param {any} rawShowtime - One entry of `movie.showtimes`.
 * @returns {object|null} The normalized showtime, or null when invalid.
 * @example
 * normalizeShowtime({ time: '13:30', version: 'VF' });
 */
function normalizeShowtime(rawShowtime) {
  if (rawShowtime === null || typeof rawShowtime !== 'object') {
    return null;
  }
  const time = toBoundedString(rawShowtime.time, MAX_SHOWTIME_STRING_LENGTH);
  if (time === null) {
    return null;
  }
  const showtime = { time };
  const version = toBoundedString(rawShowtime.version, MAX_SHOWTIME_STRING_LENGTH);
  if (version !== null) {
    showtime.version = version;
  }
  return showtime;
}

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
  const id = toBoundedId(rawMovie.id);
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
  OPTIONAL_URL_FIELDS.forEach((field) => {
    const value = toBoundedHttpUrl(rawMovie[field]);
    if (value !== null) {
      movie[field] = value;
    }
  });
  if (Array.isArray(rawMovie.showtimes)) {
    const showtimes = rawMovie.showtimes
      .slice(0, MAX_SHOWTIMES)
      .map(normalizeShowtime)
      .filter((showtime) => showtime !== null);
    if (showtimes.length > 0) {
      movie.showtimes = showtimes;
    }
  }
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
