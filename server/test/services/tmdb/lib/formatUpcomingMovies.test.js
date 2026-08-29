const { expect } = require('chai');
const tmdbUpcomingResponse = require('../tmdb-upcoming-response.json');
const expectedResult = require('../expected-result.json');
const { formatUpcomingMovies } = require('../../../../services/tmdb/lib/formatUpcomingMovies');

describe('formatUpcomingMovies', () => {
  it('should format a TMDB discover/movie response', () => {
    const movies = formatUpcomingMovies(tmdbUpcomingResponse);
    expect(movies).to.deep.equal(expectedResult);
  });
  it('should return an empty array when there are no results', () => {
    const movies = formatUpcomingMovies({ results: [] });
    expect(movies).to.deep.equal([]);
  });
  it('should return an empty array when results is missing', () => {
    const movies = formatUpcomingMovies({});
    expect(movies).to.deep.equal([]);
  });
  it('should return an empty array when the result itself is falsy', () => {
    const movies = formatUpcomingMovies(null);
    expect(movies).to.deep.equal([]);
  });
});
