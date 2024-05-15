const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');

const bodyGetWeatherStationMock = JSON.parse(JSON.stringify(require('../netatmo.getWeatherStation.mock.test.json')));
const weatherStationsDetailsMock = JSON.parse(
  JSON.stringify(require('../netatmo.loadWeatherStationDetails.mock.test.json')),
);
const NetatmoHandler = require('../../../../services/netatmo/lib/index');

const gladys = {};
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

  it('should load weather station details successfully with API not configured', async () => {
    netatmoHandler.configuration.weatherApi = false;
    nock('https://api.netatmo.com')
      .get('/api/getstationsdata?get_favorites=false')
      .reply(200, { body: bodyGetWeatherStationMock, status: 'ok' });

    const { weatherStations, modulesWeatherStations } = await netatmoHandler.loadWeatherStationDetails();
    expect(weatherStations).to.deep.eq(weatherStationsDetailsMock.weatherStations);
    expect(modulesWeatherStations).to.deep.eq(weatherStationsDetailsMock.modulesWeatherStations);
    expect(weatherStations).to.be.an('array');
    expect(modulesWeatherStations).to.be.an('array');
  });

  it('should load weather station details successfully with API configured', async () => {
    netatmoHandler.configuration.weatherApi = true;
    weatherStationsDetailsMock.weatherStations.forEach((weatherStation) => {
      weatherStation.apiNotConfigured = false;
      weatherStation.modules.forEach((module) => {
        module.apiNotConfigured = false;
        module.plug.apiNotConfigured = false;
      });
    });
    weatherStationsDetailsMock.modulesWeatherStations.forEach((moduleWeatherStations) => {
      moduleWeatherStations.apiNotConfigured = false;
      moduleWeatherStations.plug.apiNotConfigured = false;
    });
    nock('https://api.netatmo.com')
      .get('/api/getstationsdata?get_favorites=false')
      .reply(200, { body: bodyGetWeatherStationMock, status: 'ok' });

    const { weatherStations, modulesWeatherStations } = await netatmoHandler.loadWeatherStationDetails();
    expect(weatherStations).to.deep.eq(weatherStationsDetailsMock.weatherStations);
    expect(modulesWeatherStations).to.deep.eq(weatherStationsDetailsMock.modulesWeatherStations);
    expect(weatherStations).to.be.an('array');
    expect(modulesWeatherStations).to.be.an('array');
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

    const { weatherStations, modulesWeatherStations } = await netatmoHandler.loadWeatherStationDetails();

    expect(weatherStations).to.be.eq(undefined);
    expect(modulesWeatherStations).to.be.eq(undefined);
  });

  it('should handle unexpected API responses', async () => {
    nock('https://api.netatmo.com')
      .get('/api/getstationsdata?get_favorites=false')
      .reply(200, { body: bodyGetWeatherStationMock, status: 'error' });

    const { weatherStations, modulesWeatherStations } = await netatmoHandler.loadWeatherStationDetails();
    expect(weatherStations).to.deep.eq(bodyGetWeatherStationMock.devices);
    expect(modulesWeatherStations).to.deep.eq([]);
    expect(weatherStations).to.be.an('array');
    expect(modulesWeatherStations).to.be.an('array');
    expect(modulesWeatherStations).to.have.lengthOf(0);
  });
});
