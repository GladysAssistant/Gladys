// @ts-nocheck
const logger = require('../../../../../utils/logger');

/**
 * @public
 * @description This function return list of all movies filter by title.
 * @param {string} deviceId - The deviceId of Kodi to get list of movie.
 * @param {string} title - The title for search.
 * @example
 * kodi.getMoviesByTitle();
 * @returns {Object|Array} The list of all movies filter by title.
 */
async function getMoviesByTitle(deviceId, title) {
  const connection = this.mapOfKodiConnection.get(deviceId);

  if (this.checkConnectionAndServerSate(connection, deviceId)) {
    const movies = await connection.VideoLibrary.GetMovies({
      filter: { operator: 'contains', field: 'title', value: title },
      properties: ['title', 'file'],
    });
    // logger.debug(`Movies list : ${movies}`);
    logger.debug(JSON.parse(JSON.stringify(movies)).movies[0]);

    return movies;
  }
  return null;
}

module.exports = {
  getMoviesByTitle,
};
