const { expect } = require('chai');
const sinon = require('sinon');
const { MockAgent, setGlobalDispatcher } = require('undici');

const bodyGetThermostatMock = JSON.parse(JSON.stringify(require('../netatmo.getThermostat.mock.test.json')));
const thermostatsDetailsMock = JSON.parse(JSON.stringify(require('../netatmo.loadThermostatDetails.mock.test.json')));
const { FfmpegMock, childProcessMock } = require('../FfmpegMock.test');
const NetatmoHandler = require('../../../../services/netatmo/lib/index');

const gladys = {};
const serviceId = 'serviceId';
const netatmoHandler = new NetatmoHandler(gladys, FfmpegMock, childProcessMock, serviceId);
const accessToken = 'testAccessToken';

describe('Netatmo Load Thermostat Details', () => {
  let mockAgent;
  let netatmoMock;
  beforeEach(() => {
    sinon.reset();

    // 🧪 MockAgent setup
    mockAgent = new MockAgent();
    setGlobalDispatcher(mockAgent);
    mockAgent.disableNetConnect();

    netatmoMock = mockAgent.get('https://api.netatmo.com');

    netatmoHandler.status = 'not_initialized';
    netatmoHandler.accessToken = accessToken;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should load thermostat details successfully with API not configured', async () => {
    netatmoHandler.configuration.energyApi = false;

    // 🧪 Intercept the HTTP/2 call via undici
    netatmoMock
      .intercept({
        method: 'GET',
        path: '/api/getthermostatsdata',
      })
      .reply(200, {
        body: bodyGetThermostatMock,
        status: 'ok',
      });

    const { devices, modules } = await netatmoHandler.loadThermostatDetails();
    expect(devices).to.deep.eq(thermostatsDetailsMock.devices);
    expect(modules).to.deep.eq(thermostatsDetailsMock.modules);
    expect(devices).to.be.an('array');
    expect(modules).to.be.an('array');
  });

  it('should load thermostat details successfully with API configured', async () => {
    netatmoHandler.configuration.energyApi = true;
    thermostatsDetailsMock.devices.forEach((device) => {
      device.apiNotConfigured = false;
      device.modules.forEach((module) => {
        module.apiNotConfigured = false;
        module.plug.apiNotConfigured = false;
      });
    });
    thermostatsDetailsMock.modules.forEach((module) => {
      module.apiNotConfigured = false;
      module.plug.apiNotConfigured = false;
    });

    // 🧪 Intercept the HTTP/2 call via undici
    netatmoMock
      .intercept({
        method: 'GET',
        path: '/api/getthermostatsdata',
      })
      .reply(200, {
        body: bodyGetThermostatMock,
        status: 'ok',
      });

    const { devices, modules } = await netatmoHandler.loadThermostatDetails();
    expect(devices).to.deep.eq(thermostatsDetailsMock.devices);
    expect(modules).to.deep.eq(thermostatsDetailsMock.modules);
    expect(devices).to.be.an('array');
    expect(modules).to.be.an('array');
  });

  it('should handle API errors gracefully', async () => {
    // 🧪 Intercept the HTTP/2 call via undici
    netatmoMock
      .intercept({
        method: 'GET',
        path: '/api/getthermostatsdata',
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

    const { devices, modules } = await netatmoHandler.loadThermostatDetails();

    expect(devices).to.be.eq(undefined);
    expect(modules).to.be.eq(undefined);
  });

  it('should handle unexpected API responses', async () => {
    // 🧪 Intercept the HTTP/2 call via undici
    netatmoMock
      .intercept({
        method: 'GET',
        path: '/api/getthermostatsdata',
      })
      .reply(200, {
        body: bodyGetThermostatMock,
        status: 'error',
      });

    const { devices, modules } = await netatmoHandler.loadThermostatDetails();
    expect(devices).to.deep.eq(bodyGetThermostatMock.devices);
    expect(modules).to.deep.eq([]);
    expect(devices).to.be.an('array');
    expect(modules).to.be.an('array');
    expect(modules).to.have.lengthOf(0);
  });
});
