const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');

const bodyGetWeatherStationMock = JSON.parse(JSON.stringify(require('../netatmo.getWeatherStation.mock.test.json')));
const weatherStationsDetailsMock = JSON.parse(
  JSON.stringify(require('../netatmo.loadWeatherStationDetails.mock.test.json')),
);
const { FfmpegMock, childProcessMock } = require('../FfmpegMock.test');
const NetatmoHandler = require('../../../../services/netatmo/lib/index');

const gladys = {};
const serviceId = 'serviceId';
const netatmoHandler = new NetatmoHandler(gladys, FfmpegMock, childProcessMock, serviceId);
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

    const { devices, modules } = await netatmoHandler.loadWeatherStationDetails();
    expect(devices).to.deep.eq(weatherStationsDetailsMock.devices);
    expect(modules).to.deep.eq(weatherStationsDetailsMock.modules);
    expect(devices).to.be.an('array');
    expect(modules).to.be.an('array');
  });

  it('should load weather station details successfully with API configured', async () => {
    netatmoHandler.configuration.weatherApi = true;
    weatherStationsDetailsMock.devices.forEach((device) => {
      device.apiNotConfigured = false;
      device.modules.forEach((module) => {
        module.apiNotConfigured = false;
        module.plug.apiNotConfigured = false;
      });
    });
    weatherStationsDetailsMock.modules.forEach((module) => {
      module.apiNotConfigured = false;
      module.plug.apiNotConfigured = false;
    });
    nock('https://api.netatmo.com')
      .get('/api/getstationsdata?get_favorites=false')
      .reply(200, { body: bodyGetWeatherStationMock, status: 'ok' });

    const { devices, modules } = await netatmoHandler.loadWeatherStationDetails();
    expect(devices).to.deep.eq(weatherStationsDetailsMock.devices);
    expect(modules).to.deep.eq(weatherStationsDetailsMock.modules);
    expect(devices).to.be.an('array');
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

    const { devices, modules } = await netatmoHandler.loadWeatherStationDetails();

    expect(devices).to.be.eq(undefined);
    expect(modules).to.be.eq(undefined);
  });

  it('should handle unexpected API responses', async () => {
    nock('https://api.netatmo.com')
      .get('/api/getstationsdata?get_favorites=false')
      .reply(200, { body: bodyGetWeatherStationMock, status: 'error' });

    const { devices, modules } = await netatmoHandler.loadWeatherStationDetails();
    expect(devices).to.deep.eq(bodyGetWeatherStationMock.devices);
    expect(modules).to.deep.eq([]);
    expect(devices).to.be.an('array');
    expect(modules).to.be.an('array');
    expect(modules).to.have.lengthOf(0);
  });
});
