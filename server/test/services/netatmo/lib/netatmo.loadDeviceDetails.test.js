const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');

const { fake } = sinon;

const bodyHomesDataMock = require('../netatmo.homesdata.mock.test.json');
const bodyHomeStatusMock = require('../netatmo.homestatus.mock.test.json');
const thermostatsDetailsMock = require('../netatmo.loadThermostatDetails.mock.test.json');
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
const homesMock = bodyHomesDataMock.homes[0];

describe('Netatmo Load Device Details', () => {
  beforeEach(() => {
    sinon.reset();
    nock.cleanAll();

    netatmoHandler.status = 'not_initialized';
    netatmoHandler.accessToken = accessToken;
    netatmoHandler.loadThermostatDetails = sinon.stub().resolves(thermostatsDetailsMock);
    netatmoHandler.loadWeatherStationDetails = sinon.stub().resolves(weatherStationsDetailsMock);
  });

  afterEach(() => {
    sinon.reset();
    nock.cleanAll();
  });

  it('should load device details successfully', async () => {
    nock('https://api.netatmo.com')
      .get('/api/homestatus')
      .reply(200, { body: bodyHomeStatusMock, status: 'ok' });
    const devices = await netatmoHandler.loadDeviceDetails(homesMock);

    expect(devices).to.have.lengthOf(7);
    const natThermDevices = devices.filter((device) => device.type === 'NATherm1');
    const natPlugDevices = devices.filter((device) => device.type === 'NAPlug');
    const natWeatherStationDevices = devices.filter((device) => device.type === 'NAMain');
    const natNAModule4Devices = devices.filter((device) => device.type === 'NAModule4');
    expect(natThermDevices).to.have.lengthOf(1);
    expect(natPlugDevices).to.have.lengthOf(2);
    expect(natWeatherStationDevices).to.have.lengthOf(1);
    expect(natNAModule4Devices).to.have.lengthOf(1);
    expect(devices.filter((device) => device.not_handled)).to.have.lengthOf(1);
    natThermDevices.forEach((device) => {
      expect(device.room).to.be.an('object');
      expect(device.room).to.not.deep.equal({});
      expect(device.plug).to.be.an('object');
      expect(device.plug).to.not.deep.equal({});
      expect(device.categoryAPI).to.be.eq('Energy');
    });
    natWeatherStationDevices.forEach((device) => {
      expect(device.categoryAPI).to.be.eq('Weather');
      expect(device)
        .to.have.property('dashboard_data')
        .that.is.an('object');
    });
  });

  it('should load device details successfully without thermostat', async () => {
    const homesMockFake = JSON.parse(JSON.stringify(homesMock));
    homesMockFake.modules = homesMockFake.modules.filter((module) => module.type !== 'NATherm1');
    const bodyHomeStatusMockFake = JSON.parse(JSON.stringify(bodyHomeStatusMock));
    bodyHomeStatusMockFake.home.modules = bodyHomeStatusMock.home.modules.filter(
      (module) => module.type !== 'NATherm1',
    );
    netatmoHandler.loadThermostatDetails = sinon.stub().resolves([]);

    nock('https://api.netatmo.com')
      .get('/api/homestatus')
      .reply(200, { body: bodyHomeStatusMockFake, status: 'ok' });

    const devices = await netatmoHandler.loadDeviceDetails(homesMockFake);

    expect(devices).to.have.lengthOf(6);
    const natThermDevices = devices.filter((device) => device.type === 'NATherm1');
    const natPlugDevices = devices.filter((device) => device.type === 'NAPlug');
    const natWeatherStationDevices = devices.filter((device) => device.type === 'NAMain');
    const natNotHandledDevices = devices.filter((device) => device.not_handled);

    expect(natThermDevices).to.have.lengthOf(0);
    expect(natPlugDevices).to.have.lengthOf(2);
    expect(natWeatherStationDevices).to.have.lengthOf(1);
    expect(natNotHandledDevices).to.have.lengthOf(1);
  });

  it('should load device details successfully without weatherStation', async () => {
    const homesMockFake = JSON.parse(JSON.stringify(homesMock));
    homesMockFake.modules = homesMockFake.modules.filter((module) => module.type !== 'NAMain');
    const bodyHomeStatusMockFake = JSON.parse(JSON.stringify(bodyHomeStatusMock));
    bodyHomeStatusMockFake.home.modules = bodyHomeStatusMock.home.modules.filter((module) => module.type !== 'NAMain');
    netatmoHandler.loadWeatherStationDetails = sinon.stub().resolves([]);

    nock('https://api.netatmo.com')
      .get('/api/homestatus')
      .reply(200, { body: bodyHomeStatusMockFake, status: 'ok' });

    const devices = await netatmoHandler.loadDeviceDetails(homesMockFake);

    expect(devices).to.have.lengthOf(6);
    const natThermDevices = devices.filter((device) => device.type === 'NATherm1');
    const natPlugDevices = devices.filter((device) => device.type === 'NAPlug');
    const natWeatherStationDevices = devices.filter((device) => device.type === 'NAMain');
    const natNAModule4Devices = devices.filter((device) => device.type === 'NAModule4');
    const natNotHandledDevices = devices.filter((device) => device.not_handled);
    expect(natThermDevices).to.have.lengthOf(1);
    expect(natPlugDevices).to.have.lengthOf(2);
    expect(natWeatherStationDevices).to.have.lengthOf(0);
    expect(natNAModule4Devices).to.have.lengthOf(1);
    expect(natNotHandledDevices).to.have.lengthOf(1);
  });

  it('should load device details successfully but without modules thermostat', async () => {
    netatmoHandler.loadThermostatDetails = sinon.stub().resolves([]);

    nock('https://api.netatmo.com')
      .get('/api/homestatus')
      .reply(200, { body: bodyHomeStatusMock, status: 'ok' });

    const devices = await netatmoHandler.loadDeviceDetails(homesMock);

    const natThermDevices = devices.filter((device) => device.type === 'NATherm1');
    expect(natThermDevices).to.have.lengthOf.at.least(1);
    natThermDevices.forEach((device) => {
      expect(device)
        .to.have.property('plug')
        .that.is.an('object');
      expect(device.plug).to.not.have.property('plug_connected_boiler');
    });
  });

  it('should load device details successfully but without weather station details', async () => {
    netatmoHandler.loadWeatherStationDetails = sinon.stub().resolves([]);

    nock('https://api.netatmo.com')
      .get('/api/homestatus')
      .reply(200, { body: bodyHomeStatusMock, status: 'ok' });

    const devices = await netatmoHandler.loadDeviceDetails(homesMock);

    const natWeatherStationDevices = devices.filter((device) => device.type === 'NAMain');
    expect(natWeatherStationDevices).to.have.lengthOf.at.least(1);
    natWeatherStationDevices.forEach((device) => {
      expect(device)
        .to.have.property('room')
        .that.is.an('object');
      expect(device)
        .to.have.property('modules_bridged')
        .that.is.an('array');
      expect(device).to.not.have.property('dashboard_data');
    });

    const natNAModule4Devices = devices.filter((device) => device.type === 'NAModule4');
    expect(natNAModule4Devices).to.have.lengthOf.at.least(1);
    natNAModule4Devices.forEach((device) => {
      expect(device)
        .to.have.property('plug')
        .that.is.an('object');
      expect(device.plug).to.not.have.property('dashboard_data');
    });
  });

  it('should no load device details without modules', async () => {
    const homesMockFake = JSON.parse(JSON.stringify(homesMock));
    homesMockFake.modules = homesMockFake.modules.filter((module) => module.type !== 'NATherm1');
    homesMockFake.modules = homesMockFake.modules.filter((module) => module.type !== 'NAMain');
    const bodyHomeStatusMockFake = { ...bodyHomeStatusMock };
    bodyHomeStatusMockFake.home.modules = undefined;
    netatmoHandler.loadThermostatDetails = sinon.stub().resolves([]);
    netatmoHandler.loadWeatherStationDetails = sinon.stub().resolves([]);

    nock('https://api.netatmo.com')
      .get('/api/homestatus')
      .reply(200, { body: bodyHomeStatusMockFake, status: 'ok' });

    const devices = await netatmoHandler.loadDeviceDetails(homesMockFake);

    expect(devices).to.be.eq(undefined);
  });

  it('should handle API errors gracefully', async () => {
    nock('https://api.netatmo.com')
      .get('/api/homestatus')
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

    const devices = await netatmoHandler.loadDeviceDetails(homesMock);

    expect(devices).to.be.eq(undefined);
  });

  it('should handle unexpected API responses', async () => {
    nock('https://api.netatmo.com')
      .get('/api/homestatus')
      .reply(200, { body: bodyHomeStatusMock, status: 'error' });

    const devices = await netatmoHandler.loadDeviceDetails(homesMock);
    expect(devices).to.be.an('array');
    expect(devices).to.have.lengthOf(0);
  });
});
