const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');

const devicesMock = JSON.parse(JSON.stringify(require('../netatmo.loadDevicesComplete.mock.test.json')));
const deviceDetailsMock = JSON.parse(JSON.stringify(require('../netatmo.loadDevicesDetails.mock.test.json')));
const thermostatsDetailsMock = JSON.parse(JSON.stringify(require('../netatmo.loadThermostatDetails.mock.test.json')));
const weatherStationsDetailsMock = JSON.parse(
  JSON.stringify(require('../netatmo.loadWeatherStationDetails.mock.test.json')),
);
const bodyHomesDataMock = JSON.parse(JSON.stringify(require('../netatmo.homesdata.mock.test.json')));
const NetatmoHandler = require('../../../../services/netatmo/lib/index');
const logger = require('../../../../utils/logger');

const gladys = {};
const serviceId = 'serviceId';
const netatmoHandler = new NetatmoHandler(gladys, serviceId);
const accessToken = 'testAccessToken';

describe('Netatmo Load Devices', () => {
  beforeEach(() => {
    sinon.reset();
    nock.cleanAll();

    netatmoHandler.status = 'not_initialized';
    netatmoHandler.configuration.energyApi = false;
    netatmoHandler.configuration.weatherApi = false;
    netatmoHandler.accessToken = accessToken;
    netatmoHandler.loadDeviceDetails = sinon.stub().resolves(deviceDetailsMock);
    netatmoHandler.loadThermostatDetails = sinon.stub().resolves(thermostatsDetailsMock);
    netatmoHandler.loadWeatherStationDetails = sinon.stub().resolves(weatherStationsDetailsMock);
  });

  afterEach(() => {
    sinon.reset();
    nock.cleanAll();
  });

  it('should load all devices successfully if all API not configured', async () => {
    nock('https://api.netatmo.com')
      .get('/api/homesdata')
      .reply(200, { body: bodyHomesDataMock, status: 'ok' });

    const devices = await netatmoHandler.loadDevices();

    expect(devices).to.be.an('array');
    expect(devices).to.not.deep.eq([]);
  });

  it('should load energy devices successfully', async () => {
    netatmoHandler.configuration.energyApi = true;
    nock('https://api.netatmo.com')
      .get('/api/homesdata')
      .reply(200, { body: bodyHomesDataMock, status: 'ok' });

    const devices = await netatmoHandler.loadDevices();

    expect(devices).to.be.an('array');
    expect(devices).to.not.deep.eq([]);
  });

  it('should load thermostat devices successfully if no devices in loadDeviceDetails', async () => {
    netatmoHandler.configuration.energyApi = true;
    netatmoHandler.loadDeviceDetails = sinon.stub().resolves([]);
    const plugsMock = [...JSON.parse(JSON.stringify(thermostatsDetailsMock.plugs))];
    const thermostatsMock = [...JSON.parse(JSON.stringify(thermostatsDetailsMock.thermostats))];

    thermostatsMock.forEach((thermostat) => {
      plugsMock.push(thermostat);
    });
    plugsMock
      .filter((device) => device.type === 'NAPlug')
      .forEach((plug) => {
        if (!plug.modules_bridged) {
          plug.modules_bridged = plug.modules.map((module) => module._id);
        }
      });
    nock('https://api.netatmo.com')
      .get('/api/homesdata')
      .reply(200, { body: bodyHomesDataMock, status: 'ok' });

    const devices = await netatmoHandler.loadDevices();
    expect(devices).to.be.an('array');
    expect(devices).to.deep.eq(plugsMock);
  });

  it('should load weather devices successfully if no devices in loadDeviceDetails', async () => {
    netatmoHandler.configuration.weatherApi = true;
    netatmoHandler.loadDeviceDetails = sinon.stub().resolves([]);
    const weatherStationsMock = [...JSON.parse(JSON.stringify(weatherStationsDetailsMock.weatherStations))];
    const modulesWeatherStationsMock = [
      ...JSON.parse(JSON.stringify(weatherStationsDetailsMock.modulesWeatherStations)),
    ];
    modulesWeatherStationsMock.forEach((moduleWeatherStation) => {
      weatherStationsMock.push(moduleWeatherStation);
    });
    weatherStationsMock
      .filter((device) => device.type === 'NAMain')
      .forEach((plug) => {
        if (!plug.modules_bridged) {
          plug.modules_bridged = plug.modules.map((module) => module._id);
        }
      });
    const devices = await netatmoHandler.loadDevices();

    expect(devices).to.be.an('array');
    expect(devices).to.deep.eq(weatherStationsMock);
  });

  it('should load energy and weather devices successfully', async () => {
    netatmoHandler.configuration.energyApi = true;
    netatmoHandler.configuration.weatherApi = true;
    nock('https://api.netatmo.com')
      .get('/api/homesdata')
      .reply(200, { body: bodyHomesDataMock, status: 'ok' });

    const devices = await netatmoHandler.loadDevices();

    expect(devices).to.be.an('array');
    expect(devices).to.deep.eq(devicesMock);
  });

  it('should handle API errors gracefully', async () => {
    netatmoHandler.configuration.energyApi = true;
    netatmoHandler.loadThermostatDetails = sinon.stub().resolves({ plugs: [], thermostats: [] });
    nock('https://api.netatmo.com')
      .get('/api/homesdata')
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

    const devices = await netatmoHandler.loadDevices();

    expect(devices).to.deep.eq([]);
  });

  it('should handle unexpected API responses', async () => {
    netatmoHandler.configuration.energyApi = true;
    netatmoHandler.loadThermostatDetails = sinon.stub().resolves({ plugs: [], thermostats: [] });
    nock('https://api.netatmo.com')
      .get('/api/homesdata')
      .reply(200, {
        body: bodyHomesDataMock,
        status: 'error',
      });

    const devices = await netatmoHandler.loadDevices();

    expect(devices).to.be.an('array');
    expect(devices).to.have.lengthOf(0);
  });

  it('should handle API errors gracefully', async () => {
    netatmoHandler.configuration.energyApi = true;
    netatmoHandler.loadThermostatDetails = sinon.stub().resolves({ plugs: [], thermostats: [] });
    const badBodyHomesData = { ...JSON.parse(JSON.stringify(bodyHomesDataMock)) };
    badBodyHomesData.homes[0].modules = undefined;
    badBodyHomesData.homes[1].modules = undefined;
    nock('https://api.netatmo.com')
      .get('/api/homesdata')
      .reply(200, {
        body: badBodyHomesData,
        status: 'ok',
      });

    const devices = await netatmoHandler.loadDevices();

    expect(devices).to.deep.eq([]);
  });

  it('should return an empty array if no homes are returned from the API', async () => {
    netatmoHandler.configuration.energyApi = true;
    netatmoHandler.loadThermostatDetails = sinon.stub().resolves({ plugs: [], thermostats: [] });
    const bodyHomesDataEmpty = { ...JSON.parse(JSON.stringify(bodyHomesDataMock)) };
    bodyHomesDataEmpty.homes = [];

    nock('https://api.netatmo.com')
      .get('/api/homesdata')
      .reply(200, { body: bodyHomesDataEmpty, status: 'ok' });

    const devices = await netatmoHandler.loadDevices();

    expect(devices).to.deep.eq([]);
  });

  it('should return an empty array if homes are returned without modules', async () => {
    netatmoHandler.configuration.energyApi = true;
    netatmoHandler.loadThermostatDetails = sinon.stub().resolves({ plugs: [], thermostats: [] });
    const bodyHomesDataNoModules = { ...JSON.parse(JSON.stringify(bodyHomesDataMock)) };
    bodyHomesDataNoModules.homes.forEach((home) => {
      home.modules = undefined;
    });

    nock('https://api.netatmo.com')
      .get('/api/homesdata')
      .reply(200, { body: bodyHomesDataNoModules, status: 'ok' });

    const devices = await netatmoHandler.loadDevices();

    expect(devices).to.deep.eq([]);
  });

  it('should handle API errors on loadThermostatDetails and loadWeatherStationDetails', async () => {
    netatmoHandler.configuration.energyApi = true;
    netatmoHandler.configuration.weatherApi = true;
    netatmoHandler.loadThermostatDetails = sinon.stub().rejects(new Error('Failed to load thermostatsDetails'));
    netatmoHandler.loadWeatherStationDetails = sinon.stub().rejects(new Error('Failed to load weatherStationsDetails'));
    sinon.stub(logger, 'error');
    nock('https://api.netatmo.com')
      .get('/api/homesdata')
      .reply(200, {
        body: bodyHomesDataMock,
        status: 'ok',
      });

    const devices = await netatmoHandler.loadDevices();

    expect(devices).to.be.an('array');
    expect(devices).to.not.deep.eq([]);
    sinon.assert.calledTwice(logger.error);

    logger.error.restore();
  });
});
