const asyncMiddleware = require('../../../api/middlewares/asyncMiddleware');
const { AVAILABLE_LANGUAGES } = require('../../../utils/constants');

// Gladys stores a bare 2-letter language code (en/fr/de); TMDB expects a
// full locale. Any Gladys language not listed here (there are only 3) maps
// to undefined, and getUpcoming's own default (English — TMDB's most
// complete language) takes over.
const TMDB_LANGUAGE_BY_GLADYS_LANGUAGE = {
  [AVAILABLE_LANGUAGES.EN]: 'en-US',
  [AVAILABLE_LANGUAGES.FR]: 'fr-FR',
  [AVAILABLE_LANGUAGES.DE]: 'de-DE',
};

module.exports = function TmdbController(getUpcoming) {
  /**
   * @api {get} /api/v1/service/tmdb/movies/upcoming Get upcoming movies
   * @apiName getUpcomingMovies
   * @apiGroup Tmdb
   */
  async function getUpcomingController(req, res) {
    const movies = await getUpcoming({
      language: TMDB_LANGUAGE_BY_GLADYS_LANGUAGE[req.user.language],
      region: req.query.region,
      daysAhead: Number(req.query.daysAhead),
    });
    res.json(movies);
  }

  return {
    'get /api/v1/service/tmdb/movies/upcoming': {
      authenticated: true,
      controller: asyncMiddleware(getUpcomingController),
    },
  };
};
