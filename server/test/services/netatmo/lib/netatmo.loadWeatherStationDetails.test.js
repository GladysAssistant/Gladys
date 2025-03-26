const { expect } = require('chai');
const sinon = require('sinon');
const { MockAgent, setGlobalDispatcher, getGlobalDispatcher } = require('undici');

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
  let mockAgent;
  let netatmoMock;
  let originalDispatcher;

  beforeEach(() => {
    sinon.reset();

    // Store the original dispatcher
    originalDispatcher = getGlobalDispatcher();

    // MockAgent setup
    mockAgent = new MockAgent();
    setGlobalDispatcher(mockAgent);
    mockAgent.disableNetConnect();

    netatmoMock = mockAgent.get('https://api.netatmo.com');

    netatmoHandler.status = 'not_initialized';
    netatmoHandler.accessToken = accessToken;
  });

  afterEach(() => {
    sinon.reset();
    // Clean up the mock agent
    mockAgent.close();
    // Restore the original dispatcher
    setGlobalDispatcher(originalDispatcher);
  });

  it('should load weather station details successfully with API not configured', async () => {
    netatmoHandler.configuration.weatherApi = false;

    // Intercept the HTTP/2 call via undici
    netatmoMock
      .intercept({
        method: 'GET',
        path: '/api/getstationsdata?get_favorites=false',
      })
      .reply(200, {
        body: bodyGetWeatherStationMock,
        status: 'ok',
      });

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

    // Intercept the HTTP/2 call via undici
    netatmoMock
      .intercept({
        method: 'GET',
        path: '/api/getstationsdata?get_favorites=false',
      })
      .reply(200, {
        body: bodyGetWeatherStationMock,
        status: 'ok',
      });

    const { devices, modules } = await netatmoHandler.loadWeatherStationDetails();
    expect(devices).to.deep.eq(weatherStationsDetailsMock.devices);
    expect(modules).to.deep.eq(weatherStationsDetailsMock.modules);
    expect(devices).to.be.an('array');
    expect(modules).to.be.an('array');
  });

  it('should handle API errors gracefully', async () => {
    // Intercept the HTTP/2 call via undici
    netatmoMock
      .intercept({
        method: 'GET',
        path: '/api/getstationsdata?get_favorites=false',
      })
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
    // Intercept the HTTP/2 call via undici
    netatmoMock
      .intercept({
        method: 'GET',
        path: '/api/getstationsdata?get_favorites=false',
      })
      .reply(200, {
        body: bodyGetWeatherStationMock,
        status: 'error',
      });

    const { devices, modules } = await netatmoHandler.loadWeatherStationDetails();
    expect(devices).to.deep.eq(bodyGetWeatherStationMock.devices);
    expect(modules).to.deep.eq([]);
    expect(devices).to.be.an('array');
    expect(modules).to.be.an('array');
    expect(modules).to.have.lengthOf(0);
  });
});
