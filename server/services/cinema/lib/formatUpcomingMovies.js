const TMDB_POSTER_BASE_URL = 'https://image.tmdb.org/t/p/w342';

/**
 * @description Transform a TMDB /movie/upcoming response into Gladys movie data.
 * @param {object} result - The result of the API call to TMDB.
 * @returns {Array} Return a list of formatted upcoming movies.
 * @example
 * const movies = formatUpcomingMovies(result);
 */
function formatUpcomingMovies(result) {
  const movies = (result && result.results) || [];
  return movies.map((movie) => ({
    id: movie.id,
    title: movie.title,
    overview: movie.overview,
    releaseDate: movie.release_date,
    posterUrl: movie.poster_path ? `${TMDB_POSTER_BASE_URL}${movie.poster_path}` : null,
  }));
}

module.exports = {
  formatUpcomingMovies,
};
