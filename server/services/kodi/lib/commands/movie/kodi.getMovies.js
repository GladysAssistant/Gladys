// @ts-nocheck
const logger = require('../../../../../utils/logger');

/**
 * @public
 * @description This function return list of all movies.
 * @param {string} deviceId - The deviceId of Kodi to get list of all movies.
 * @example
 * kodi.getMovies();
 * @returns {Object|Array} The list of all movies.
 */
async function getMovies(deviceId) {
  const connection = this.mapOfKodiConnection.get(deviceId);

  if (this.checkConnectionAndServerSate(connection, deviceId)) {
    const movies = await connection.VideoLibrary.GetMovies({ properties: ['title', 'file'] });
    // logger.debug(`Movies list : ${movies}`);
    logger.debug(JSON.parse(JSON.stringify(movies)).movies[0]);

    return movies;
  }
  return null;
}

module.exports = {
  getMovies,
};
