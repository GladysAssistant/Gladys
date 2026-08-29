const logger = require('../../utils/logger');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');
const { Error400 } = require('../../utils/httpErrors');
const { ERROR_MESSAGES } = require('../../utils/constants');
const { formatUpcomingMovies } = require('./lib/formatUpcomingMovies');
const { resolveRegionalReleaseDate } = require('./lib/resolveRegionalReleaseDate');
const { resolveTrailerUrl } = require('./lib/resolveTrailerUrl');
const { mapWithConcurrency } = require('./lib/mapWithConcurrency');
const CinemaController = require('./controllers/cinema.controller');

const TMDB_API_KEY = 'TMDB_API_KEY';
const CACHE_DURATION_IN_MS = 30 * 60 * 1000;
const DEFAULT_DAYS_AHEAD = 30;
const ALLOWED_DAYS_AHEAD = [15, 30, 60];
const DEFAULT_REGION = 'FR';
// Enriching a movie fires 1-2 extra TMDB requests (details + an occasional
// English fallback). Firing all of them at once for a full discover page
// (up to 20 movies) is a burst of 20-40 simultaneous HTTPS calls — a rate-
// limit risk, and needlessly heavy on a Raspberry Pi. Small batches instead.
const ENRICH_CONCURRENCY = 5;
// Smaller/foreign titles are often not translated into every language on
// TMDB yet: `overview` and the trailer can genuinely be missing for the
// requested language. English is by far the most complete language on
// TMDB, so it's the fallback tried before giving up on either.
const FALLBACK_OVERVIEW_LANGUAGE = 'en-US';

/**
 * @description Format a date as TMDB expects it (YYYY-MM-DD), in the server's local timezone.
 * @param {Date} date - The date to format.
 * @returns {string} The formatted date.
 * @example
 * const formatted = formatDate(new Date());
 */
function formatDate(date) {
  // Deliberately local (getFullYear/getMonth/getDate), not
  // toISOString()/UTC: Gladys is self-hosted, so the server's OS timezone is
  // almost always the house's own — using UTC here could drop or include a
  // release near local midnight. A fully house-scoped timezone (like the
  // weather service's house selector) would need this service to accept a
  // house, which it doesn't today.
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

module.exports = function CinemaService(gladys, serviceId) {
  const { default: axios } = require('axios');
  let tmdbApiKey;
  const cache = new Map();

  /**
   * @public
   * @description This function starts the service.
   * @example
   * gladys.services.cinema.start();
   */
  async function start() {
    logger.info('Starting Cinema service');
    tmdbApiKey = await gladys.variable.getValue(TMDB_API_KEY, serviceId);
    if (!tmdbApiKey) {
      throw new ServiceNotConfiguredError('Cinema Service not configured');
    }
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   * gladys.services.cinema.stop();
   */
  async function stop() {
    logger.info('Stopping Cinema service');
  }

  /**
   * @description Get a cached value, or compute and cache it.
   * @param {string} cacheKey - The cache key.
   * @param {Function} computeValue - Async function returning the value to cache.
   * @returns {Promise<object>} Resolve with the cached or freshly computed value.
   * @example
   * const value = await getOrCompute('upcoming:fr-FR:FR', () => doSomething());
   */
  async function getOrCompute(cacheKey, computeValue) {
    const cached = cache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }
    const value = await computeValue();
    cache.set(cacheKey, { value, expiresAt: Date.now() + CACHE_DURATION_IN_MS });
    return value;
  }

  /**
   * @description Get a movie's details (overview + release dates + videos) in a given language, null on failure.
   * @param {number} movieId - The TMDB movie id.
   * @param {string} language - The TMDB locale to request (ex. 'fr-FR').
   * @returns {Promise<object|null>} The raw TMDB movie details response, or null.
   * @example
   * const details = await getMovieDetails(1234, 'fr-FR');
   */
  async function getMovieDetails(movieId, language) {
    try {
      const url = `https://api.themoviedb.org/3/movie/${movieId}?api_key=${tmdbApiKey}&language=${language}&append_to_response=release_dates,videos`;
      const { data } = await axios.get(url);
      return data;
    } catch (e) {
      logger.warn(`Cinema service: unable to get details for movie ${movieId}`);
      return null;
    }
  }

  /**
   * @description Enrich a discover/movie candidate with its regional release date, a non-empty overview and a trailer.
   * @param {object} movie - A movie formatted by formatUpcomingMovies.
   * @param {string} language - The TMDB locale requested by the caller (ex. 'fr-FR').
   * @param {string} region - The ISO 3166-1 region code (ex. 'FR').
   * @returns {Promise<object>} The movie, with its releaseDate corrected, overview and trailerUrl filled if possible.
   * @example
   * const enriched = await enrichMovie(movie, 'fr-FR', 'FR');
   */
  async function enrichMovie(movie, language, region) {
    const details = await getMovieDetails(movie.id, language);
    let overview = (details && details.overview) || '';
    let trailerUrl = (details && details.videos && resolveTrailerUrl(details.videos)) || null;
    // Smaller/foreign titles often lack a translated overview AND a trailer
    // in the requested language on TMDB. English is by far the most
    // complete language there, so it's the fallback tried before giving up
    // — a single extra call covers both gaps at once.
    if ((!overview || !trailerUrl) && language !== FALLBACK_OVERVIEW_LANGUAGE) {
      const fallbackDetails = await getMovieDetails(movie.id, FALLBACK_OVERVIEW_LANGUAGE);
      if (!overview) {
        overview = (fallbackDetails && fallbackDetails.overview) || '';
      }
      if (!trailerUrl) {
        trailerUrl = (fallbackDetails && fallbackDetails.videos && resolveTrailerUrl(fallbackDetails.videos)) || null;
      }
    }
    if (!overview) {
      overview = movie.overview || '';
    }
    // discover/movie's own `release_date` field is the movie's PRIMARY
    // (worldwide) release date, not the regional one, even when filtering by
    // `region` + `release_date.gte/lte` — it can be years off (a re-release,
    // a festival premiere...). The release_dates appended to the movie
    // details is the only reliable source for the actual regional date.
    const releaseDate =
      (details && details.release_dates && resolveRegionalReleaseDate(details.release_dates, region)) ||
      movie.releaseDate;
    return { ...movie, overview, trailerUrl, releaseDate };
  }

  /**
   * @description Get the list of upcoming movie releases.
   * @param {object} [options] - Options parameters.
   * @param {string} [options.language] - The language of the results (TMDB format, ex. 'fr-FR').
   * @param {string} [options.region] - The region to get theatrical release dates for (ISO 3166-1).
   * @param {number} [options.daysAhead] - How many days ahead to look for releases (15, 30 or 60).
   * @returns {Promise<Array>} Resolve with the list of upcoming movies, soonest release first.
   * @example
   * gladys.services.cinema.movies.getUpcoming({ language: 'fr-FR', region: 'FR', daysAhead: 30 });
   */
  async function getUpcoming(options = {}) {
    if (!tmdbApiKey) {
      throw new ServiceNotConfiguredError('TMDB API Key not found');
    }
    const language = options.language || FALLBACK_OVERVIEW_LANGUAGE;
    const region = options.region || DEFAULT_REGION;
    const daysAhead = ALLOWED_DAYS_AHEAD.includes(options.daysAhead) ? options.daysAhead : DEFAULT_DAYS_AHEAD;
    const cacheKey = `upcoming:${language}:${region}:${daysAhead}`;
    return getOrCompute(cacheKey, async () => {
      const today = new Date();
      const lastDay = new Date();
      lastDay.setDate(today.getDate() + daysAhead);
      const todayFormatted = formatDate(today);
      const lastDayFormatted = formatDate(lastDay);
      const params = [
        `api_key=${tmdbApiKey}`,
        `language=${language}`,
        `region=${region}`,
        'with_release_type=2|3',
        `release_date.gte=${todayFormatted}`,
        `release_date.lte=${lastDayFormatted}`,
      ].join('&');
      const url = `https://api.themoviedb.org/3/discover/movie?${params}`;
      try {
        const { data } = await axios.get(url);
        const candidates = formatUpcomingMovies(data);
        const enrichedMovies = await mapWithConcurrency(candidates, ENRICH_CONCURRENCY, (movie) =>
          enrichMovie(movie, language, region),
        );
        return enrichedMovies
          .filter((movie) => movie.releaseDate >= todayFormatted && movie.releaseDate <= lastDayFormatted)
          .sort((a, b) => (a.releaseDate < b.releaseDate ? -1 : 1));
      } catch (e) {
        logger.error(e);
        throw new Error400(ERROR_MESSAGES.REQUEST_TO_THIRD_PARTY_FAILED);
      }
    });
  }

  return Object.freeze({
    start,
    stop,
    controllers: CinemaController(getUpcoming),
    movies: {
      getUpcoming,
    },
  });
};
