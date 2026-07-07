const { expect } = require('chai');
const { fake } = require('sinon');
const MeteoController = require('../../../services/meteo/controllers/meteo.controller');
const { forecastData, warningDataGreen, warningDataOrange } = require('./meteo.data');

const gladys = {
  house: {
    getBySelector: fake.resolves({
      selector: 'main-house',
      name: 'Maison',
      latitude: 46.75,
      longitude: 4.35,
    }),
  },
};

const buildRes = () => {
  const res = {};
  res.status = fake.returns(res);
  res.json = fake.returns(null);
  return res;
};

const buildController = ({
  gladysInstance = gladys,
  getVigilance = fake.resolves(warningDataGreen),
  getForecast = fake.resolves(forecastData),
  getVigilanceMap = fake.resolves(null),
  source = 'meteofrance',
} = {}) => MeteoController(gladysInstance, getVigilance, getForecast, getVigilanceMap, () => source);

describe('MeteoController', () => {
  it('should return 400 when no dept is provided on vigilance route', async () => {
    const controller = buildController();
    const res = buildRes();
    await controller['get /api/v1/service/meteo/vigilance'].controller({ query: {} }, res);
    expect(res.status.firstCall.lastArg).to.equal(400);
    expect(res.json.firstCall.lastArg).to.deep.equal({ message: 'DEPT_REQUIRED' });
  });
  it('should return filtered alerts on vigilance route', async () => {
    const controller = buildController({ getVigilance: fake.resolves(warningDataOrange) });
    const res = buildRes();
    await controller['get /api/v1/service/meteo/vigilance'].controller({ query: { dept: '71' } }, res);
    expect(res.json.firstCall.lastArg).to.deep.equal({
      alerts: [
        { dept: '71', color: 3, phenomene_id: 3, phenomene_nom: 'Orages' },
        { dept: '71', color: 2, phenomene_id: 6, phenomene_nom: 'Canicule' },
      ],
    });
  });
  it('should return 404 on vigilance map route without API key', async () => {
    const controller = buildController();
    const res = buildRes();
    await controller['get /api/v1/service/meteo/vigilance/map'].controller({}, res);
    expect(res.status.firstCall.lastArg).to.equal(404);
    expect(res.json.firstCall.lastArg).to.deep.equal({ message: 'NO_API_KEY' });
  });
  it('should return vigilance map image', async () => {
    const controller = buildController({ getVigilanceMap: fake.resolves('data:image/png;base64,QUJD') });
    const res = buildRes();
    await controller['get /api/v1/service/meteo/vigilance/map'].controller({}, res);
    expect(res.json.firstCall.lastArg).to.deep.equal({ image: 'data:image/png;base64,QUJD' });
  });
  it('should return 400 when the house has no coordinates', async () => {
    const gladysNoCoordinates = {
      house: {
        getBySelector: fake.resolves({ selector: 'main-house', latitude: null, longitude: null }),
      },
    };
    const controller = buildController({ gladysInstance: gladysNoCoordinates });
    const res = buildRes();
    await controller['get /api/v1/house/:house_selector/meteo/weather'].controller(
      { params: { house_selector: 'main-house' }, query: {} },
      res,
    );
    expect(res.status.firstCall.lastArg).to.equal(400);
    expect(res.json.firstCall.lastArg).to.deep.equal({ message: 'HOUSE_HAS_NO_COORDINATES' });
  });
  it('should return 502 when the forecast API fails', async () => {
    const controller = buildController({ getForecast: fake.rejects(new Error('timeout')) });
    const res = buildRes();
    await controller['get /api/v1/house/:house_selector/meteo/weather'].controller(
      { params: { house_selector: 'main-house' }, query: {} },
      res,
    );
    expect(res.status.firstCall.lastArg).to.equal(502);
    expect(res.json.firstCall.lastArg).to.deep.equal({ message: 'FORECAST_API_ERROR', detail: 'timeout' });
  });
  it('should return 400 when the OpenWeather API key is missing', async () => {
    const missingKeyError = new Error('Meteo: OpenWeather API key is not configured');
    // @ts-ignore: custom field set by the service
    missingKeyError.code = 'OPENWEATHER_API_KEY_MISSING';
    const getForecast = fake.rejects(missingKeyError);
    const controller = buildController({ getForecast, source: 'openweather' });
    const res = buildRes();
    await controller['get /api/v1/house/:house_selector/meteo/weather'].controller(
      { params: { house_selector: 'main-house' }, query: {} },
      res,
    );
    expect(res.status.firstCall.lastArg).to.equal(400);
    expect(res.json.firstCall.lastArg).to.deep.equal({ message: 'OPENWEATHER_API_KEY_MISSING' });
  });
  it('should return forecast without vigilance when not requested', async () => {
    const getVigilance = fake.resolves(warningDataOrange);
    const controller = buildController({ getVigilance });
    const res = buildRes();
    await controller['get /api/v1/house/:house_selector/meteo/weather'].controller(
      { params: { house_selector: 'main-house' }, query: {} },
      res,
    );
    expect(getVigilance.callCount).to.equal(0);
    expect(res.json.firstCall.lastArg).to.deep.equal({
      source: 'meteofrance',
      house: { name: 'Maison' },
      forecast: forecastData,
      vigilance: { alerts: [], dept: '71', text: '' },
    });
  });
  it('should return forecast with parsed vigilance alerts and bulletin text', async () => {
    const getVigilance = fake.resolves(warningDataOrange);
    const controller = buildController({ getVigilance });
    const res = buildRes();
    await controller['get /api/v1/house/:house_selector/meteo/weather'].controller(
      { params: { house_selector: 'main-house' }, query: { vigilance: 'true' } },
      res,
    );
    expect(getVigilance.firstCall.lastArg).to.equal('71');
    expect(res.json.firstCall.lastArg).to.deep.equal({
      source: 'meteofrance',
      house: { name: 'Maison' },
      forecast: forecastData,
      vigilance: {
        alerts: [
          { dept: '71', color: 3, phenomene_id: 3, phenomene_nom: 'Orages' },
          { dept: '71', color: 2, phenomene_id: 6, phenomene_nom: 'Canicule' },
        ],
        dept: '71',
        text: 'Orages violents attendus en soirée.',
      },
    });
  });
  it('should not fail when vigilance fetch fails', async () => {
    const controller = buildController({ getVigilance: fake.rejects(new Error('warning down')) });
    const res = buildRes();
    await controller['get /api/v1/house/:house_selector/meteo/weather'].controller(
      { params: { house_selector: 'main-house' }, query: { vigilance: 'true' } },
      res,
    );
    expect(res.json.firstCall.lastArg).to.deep.equal({
      source: 'meteofrance',
      house: { name: 'Maison' },
      forecast: forecastData,
      vigilance: { alerts: [], dept: '71', text: '' },
    });
  });
  it('should never fetch Météo France vigilance with the OpenWeather source', async () => {
    // OpenWeather forecast converted to the Météo France format has no dept
    const owForecast = { ...forecastData, position: { name: 'Montreal', dept: null } };
    const getVigilance = fake.resolves(warningDataOrange);
    const controller = buildController({
      getForecast: fake.resolves(owForecast),
      getVigilance,
      source: 'openweather',
    });
    const res = buildRes();
    await controller['get /api/v1/house/:house_selector/meteo/weather'].controller(
      { params: { house_selector: 'main-house' }, query: { vigilance: 'true' } },
      res,
    );
    expect(getVigilance.callCount).to.equal(0);
    expect(res.json.firstCall.lastArg).to.deep.equal({
      source: 'openweather',
      house: { name: 'Maison' },
      forecast: owForecast,
      vigilance: { alerts: [], dept: null, text: '' },
    });
  });
});
