const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;
const expectedResult = require('./expected-result.json');
const TmdbController = require('../../../services/tmdb/controllers/tmdb.controller');

describe('TmdbController', () => {
  afterEach(() => {
    sinon.restore();
  });
  it('should get upcoming movies in the user language', async () => {
    const getUpcoming = fake.resolves(expectedResult);
    const req = { query: {}, user: { language: 'fr' } };
    const res = {
      json: fake.returns(null),
    };
    const tmdbController = TmdbController(getUpcoming);
    await tmdbController['get /api/v1/service/tmdb/movies/upcoming'].controller(req, res);
    expect(getUpcoming.firstCall.args[0]).to.deep.equal({ language: 'fr-FR', region: undefined, daysAhead: NaN });
    expect(res.json.firstCall.args[0]).to.deep.equal(expectedResult);
  });
  it('should map every Gladys language to its TMDB locale', async () => {
    const getUpcoming = fake.resolves(expectedResult);
    const res = { json: fake.returns(null) };
    const tmdbController = TmdbController(getUpcoming);
    await tmdbController['get /api/v1/service/tmdb/movies/upcoming'].controller(
      { query: {}, user: { language: 'en' } },
      res,
    );
    await tmdbController['get /api/v1/service/tmdb/movies/upcoming'].controller(
      { query: {}, user: { language: 'de' } },
      res,
    );
    expect(getUpcoming.getCall(0).args[0].language).to.equal('en-US');
    expect(getUpcoming.getCall(1).args[0].language).to.equal('de-DE');
  });
  it('should forward the daysAhead query parameter as a number', async () => {
    const getUpcoming = fake.resolves(expectedResult);
    const req = { query: { daysAhead: '15' }, user: { language: 'fr' } };
    const res = {
      json: fake.returns(null),
    };
    const tmdbController = TmdbController(getUpcoming);
    await tmdbController['get /api/v1/service/tmdb/movies/upcoming'].controller(req, res);
    expect(getUpcoming.firstCall.args[0]).to.deep.equal({ language: 'fr-FR', region: undefined, daysAhead: 15 });
  });
});
