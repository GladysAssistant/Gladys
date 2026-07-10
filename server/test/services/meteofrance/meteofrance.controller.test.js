const { expect } = require('chai');
const { fake } = require('sinon');
const MeteoFranceController = require('../../../services/meteofrance/controllers/meteofrance.controller');
const { forecastData, warningDataGreen, warningDataOrange } = require('./meteofrance.data');

const gladys = {
  house: {
    getBySelector: fake.resolves({
      selector: 'main-house',
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

describe('MeteoFranceController', () => {
  it('should return 400 when no dept is provided on vigilance route', async () => {
    const controller = MeteoFranceController(gladys, fake.resolves(warningDataGreen), fake.resolves(forecastData));
    const res = buildRes();
    await controller['get /api/v1/service/meteofrance/vigilance'].controller({ query: {} }, res);
    expect(res.status.firstCall.lastArg).to.equal(400);
    expect(res.json.firstCall.lastArg).to.deep.equal({ message: 'DEPT_REQUIRED' });
  });
  it('should return filtered alerts on vigilance route', async () => {
    const controller = MeteoFranceController(gladys, fake.resolves(warningDataOrange), fake.resolves(forecastData));
    const res = buildRes();
    await controller['get /api/v1/service/meteofrance/vigilance'].controller({ query: { dept: '71' } }, res);
    expect(res.json.firstCall.lastArg).to.deep.equal({
      alerts: [
        { dept: '71', color: 3, phenomene_id: 3, phenomene_nom: 'Orages' },
        { dept: '71', color: 2, phenomene_id: 6, phenomene_nom: 'Canicule' },
      ],
    });
  });
  it('should return 404 on vigilance map route without API key', async () => {
    const controller = MeteoFranceController(
      gladys,
      fake.resolves(warningDataGreen),
      fake.resolves(forecastData),
      fake.resolves(null),
    );
    const res = buildRes();
    await controller['get /api/v1/service/meteofrance/vigilance/map'].controller({}, res);
    expect(res.status.firstCall.lastArg).to.equal(404);
    expect(res.json.firstCall.lastArg).to.deep.equal({ message: 'NO_API_KEY' });
  });
  it('should return vigilance map image', async () => {
    const controller = MeteoFranceController(
      gladys,
      fake.resolves(warningDataGreen),
      fake.resolves(forecastData),
      fake.resolves('data:image/png;base64,QUJD'),
    );
    const res = buildRes();
    await controller['get /api/v1/service/meteofrance/vigilance/map'].controller({ query: {} }, res);
    expect(res.json.firstCall.lastArg).to.deep.equal({ image: 'data:image/png;base64,QUJD' });
  });
  it('should request the J1 vigilance map when asked', async () => {
    const getVigilanceMap = fake.resolves('data:image/png;base64,SjE=');
    const controller = MeteoFranceController(
      gladys,
      fake.resolves(warningDataGreen),
      fake.resolves(forecastData),
      getVigilanceMap,
    );
    const res = buildRes();
    await controller['get /api/v1/service/meteofrance/vigilance/map'].controller({ query: { day: 'J1' } }, res);
    expect(getVigilanceMap.firstCall.lastArg).to.equal('J1');
    expect(res.json.firstCall.lastArg).to.deep.equal({ image: 'data:image/png;base64,SjE=' });
  });
  it('should return 400 when the house has no coordinates', async () => {
    const gladysNoCoordinates = {
      house: {
        getBySelector: fake.resolves({ selector: 'main-house', latitude: null, longitude: null }),
      },
    };
    const controller = MeteoFranceController(
      gladysNoCoordinates,
      fake.resolves(warningDataGreen),
      fake.resolves(forecastData),
    );
    const res = buildRes();
    await controller['get /api/v1/house/:house_selector/meteofrance/weather'].controller(
      { params: { house_selector: 'main-house' }, query: {} },
      res,
    );
    expect(res.status.firstCall.lastArg).to.equal(400);
    expect(res.json.firstCall.lastArg).to.deep.equal({ message: 'HOUSE_HAS_NO_COORDINATES' });
  });
  it('should return 502 when the forecast API fails', async () => {
    const controller = MeteoFranceController(
      gladys,
      fake.resolves(warningDataGreen),
      fake.rejects(new Error('timeout')),
    );
    const res = buildRes();
    await controller['get /api/v1/house/:house_selector/meteofrance/weather'].controller(
      { params: { house_selector: 'main-house' }, query: {} },
      res,
    );
    expect(res.status.firstCall.lastArg).to.equal(502);
    expect(res.json.firstCall.lastArg).to.deep.equal({ message: 'FORECAST_API_ERROR', detail: 'timeout' });
  });
  it('should return forecast without vigilance when not requested', async () => {
    const getVigilance = fake.resolves(warningDataOrange);
    const controller = MeteoFranceController(gladys, getVigilance, fake.resolves(forecastData));
    const res = buildRes();
    await controller['get /api/v1/house/:house_selector/meteofrance/weather'].controller(
      { params: { house_selector: 'main-house' }, query: {} },
      res,
    );
    expect(getVigilance.callCount).to.equal(0);
    expect(res.json.firstCall.lastArg).to.deep.equal({
      source: 'meteofrance',
      house: { selector: 'main-house', latitude: 46.75, longitude: 4.35 },
      forecast: forecastData,
      vigilance: { alerts: [], dept: '71', text: '' },
    });
  });
  it('should return forecast with parsed vigilance alerts and bulletin text', async () => {
    const getVigilance = fake.resolves(warningDataOrange);
    const controller = MeteoFranceController(gladys, getVigilance, fake.resolves(forecastData));
    const res = buildRes();
    await controller['get /api/v1/house/:house_selector/meteofrance/weather'].controller(
      { params: { house_selector: 'main-house' }, query: { vigilance: 'true' } },
      res,
    );
    expect(getVigilance.firstCall.lastArg).to.equal('71');
    expect(res.json.firstCall.lastArg).to.deep.equal({
      source: 'meteofrance',
      house: { selector: 'main-house', latitude: 46.75, longitude: 4.35 },
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
    const controller = MeteoFranceController(
      gladys,
      fake.rejects(new Error('warning down')),
      fake.resolves(forecastData),
    );
    const res = buildRes();
    await controller['get /api/v1/house/:house_selector/meteofrance/weather'].controller(
      { params: { house_selector: 'main-house' }, query: { vigilance: 'true' } },
      res,
    );
    expect(res.json.firstCall.lastArg).to.deep.equal({
      source: 'meteofrance',
      house: { selector: 'main-house', latitude: 46.75, longitude: 4.35 },
      forecast: forecastData,
      vigilance: { alerts: [], dept: '71', text: '' },
    });
  });
});
