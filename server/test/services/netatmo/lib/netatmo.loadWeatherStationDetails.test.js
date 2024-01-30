const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');

const { fake } = sinon;

const bodyGetWeatherStationMock = require('../netatmo.getWeatherStation.mock.test.json');
const weatherStationsDetailsMock = require('../netatmo.loadWeatherStationDetails.mock.test.json');
const NetatmoHandler = require('../../../../services/netatmo/lib/index');

const gladys = {
  event: {
    emit: fake.resolves(null),
  },
  stateManager: {
    get: sinon.stub().resolves(),
  },
  variable: {
    setValue: fake.resolves(null),
  },
};
const serviceId = 'serviceId';
const netatmoHandler = new NetatmoHandler(gladys, serviceId);
const accessToken = 'testAccessToken';

describe('Netatmo Load Weather Station Details', () => {
  beforeEach(() => {
    sinon.reset();
    nock.cleanAll();

    netatmoHandler.status = 'not_initialized';
    netatmoHandler.accessToken = accessToken;
  });

  afterEach(() => {
    sinon.reset();
    nock.cleanAll();
  });

  it('should load weather station details successfully', async () => {
    nock('https://api.netatmo.com')
      .get('/api/getstationsdata?get_favorites=false')
      .reply(200, { body: bodyGetWeatherStationMock, status: 'ok' });

    const { weatherStations, modules } = await netatmoHandler.loadWeatherStationDetails();
    expect(weatherStations).to.deep.eq(weatherStationsDetailsMock.weatherStations);
    expect(modules).to.deep.eq(weatherStationsDetailsMock.modules);
    expect(weatherStations).to.be.an('array');
    expect(modules).to.be.an('array');
  });

  it('should handle API errors gracefully', async () => {
    nock('https://api.netatmo.com')
      .get('/api/getstationsdata?get_favorites=false')
      .reply(400, {
        error: {
          code: {
            type: 'number',
            example: 21,
          },
          message: {
            type: 'string',
            example: 'invalid [parameter]',
          },
        },
      });

    const { weatherStations, modules } = await netatmoHandler.loadWeatherStationDetails();

    expect(weatherStations).to.be.eq(undefined);
    expect(modules).to.be.eq(undefined);
  });

  it('should handle unexpected API responses', async () => {
    nock('https://api.netatmo.com')
      .get('/api/getstationsdata?get_favorites=false')
      .reply(200, { body: bodyGetWeatherStationMock, status: 'error' });

    const { weatherStations, modules } = await netatmoHandler.loadWeatherStationDetails();
    expect(weatherStations).to.deep.eq(weatherStationsDetailsMock.weatherStations);
    expect(modules).to.deep.eq([]);
    expect(weatherStations).to.be.an('array');
    expect(modules).to.be.an('array');
    expect(modules).to.have.lengthOf(0);
  });
});
