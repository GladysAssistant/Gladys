const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;
const PremieresController = require('../../../api/controllers/premieres.controller');

const expectedMovies = [{ id: 1, title: 'A movie' }];

describe('PremieresController', () => {
  afterEach(() => {
    sinon.restore();
  });

  describe('getUpcoming', () => {
    it('should get upcoming movies in the user language', async () => {
      const gladys = {
        premieres: { getUpcoming: fake.resolves(expectedMovies) },
      };
      const req = { query: {}, user: { language: 'fr' } };
      const res = { json: fake.returns(null) };
      const premieresController = PremieresController(gladys);
      await premieresController.getUpcoming(req, res);
      expect(gladys.premieres.getUpcoming.firstCall.args[0]).to.deep.equal({
        language: 'fr',
        region: undefined,
        daysAhead: NaN,
      });
      expect(res.json.firstCall.args[0]).to.deep.equal(expectedMovies);
    });
    it('should forward the daysAhead and region query parameters', async () => {
      const gladys = {
        premieres: { getUpcoming: fake.resolves(expectedMovies) },
      };
      const req = { query: { daysAhead: '15', region: 'US' }, user: { language: 'en' } };
      const res = { json: fake.returns(null) };
      const premieresController = PremieresController(gladys);
      await premieresController.getUpcoming(req, res);
      expect(gladys.premieres.getUpcoming.firstCall.args[0]).to.deep.equal({
        language: 'en',
        region: 'US',
        daysAhead: 15,
      });
    });
    it('should pin the provider chosen in the widget configuration', async () => {
      const gladys = {
        premieres: { getUpcoming: fake.resolves(expectedMovies) },
      };
      const req = { query: { service: 'tmdb' }, user: { language: 'fr' } };
      const res = { json: fake.returns(null) };
      const premieresController = PremieresController(gladys);
      await premieresController.getUpcoming(req, res);
      expect(gladys.premieres.getUpcoming.firstCall.args[0]).to.have.property('service', 'tmdb');
    });
    it('should not forward an empty service query parameter', async () => {
      const gladys = {
        premieres: { getUpcoming: fake.resolves(expectedMovies) },
      };
      const req = { query: { service: '' }, user: { language: 'fr' } };
      const res = { json: fake.returns(null) };
      const premieresController = PremieresController(gladys);
      await premieresController.getUpcoming(req, res);
      expect(gladys.premieres.getUpcoming.firstCall.args[0]).to.not.have.property('service');
    });
  });

  describe('getProviders', () => {
    it('should list the providers with their integration label and region/period support', async () => {
      const services = {
        'ext-tvdb': { movies: { getUpcoming: fake.resolves([]) } },
        tmdb: { movies: { getUpcoming: fake.resolves([]), supportsRegionAndPeriod: true } },
      };
      const gladys = {
        premieres: { getProviders: fake.returns(['ext-tvdb', 'tmdb']) },
        externalIntegration: {
          get: fake.resolves([{ name: 'ext-tvdb', manifest: { name: 'TVDB' } }]),
        },
        service: { getService: (name) => services[name] },
      };
      const req = {};
      const res = { json: fake.returns(null) };
      const premieresController = PremieresController(gladys);
      await premieresController.getProviders(req, res);
      expect(res.json.firstCall.args[0]).to.deep.equal([
        { service_name: 'ext-tvdb', label: 'TVDB', supports_region_and_period: false },
        { service_name: 'tmdb', label: null, supports_region_and_period: true },
      ]);
    });
    it('should default to false when the service cannot be found', async () => {
      const gladys = {
        premieres: { getProviders: fake.returns(['gone']) },
        externalIntegration: { get: fake.resolves([]) },
        service: { getService: fake.returns(null) },
      };
      const req = {};
      const res = { json: fake.returns(null) };
      const premieresController = PremieresController(gladys);
      await premieresController.getProviders(req, res);
      expect(res.json.firstCall.args[0]).to.deep.equal([
        { service_name: 'gone', label: null, supports_region_and_period: false },
      ]);
    });
  });
});
