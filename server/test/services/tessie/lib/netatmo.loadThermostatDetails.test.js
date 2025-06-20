const { expect } = require('chai');
const sinon = require('sinon');
const { MockAgent, setGlobalDispatcher, getGlobalDispatcher } = require('undici');

const bodyGetThermostatMock = JSON.parse(JSON.stringify(require('../netatmo.getThermostat.mock.test.json')));
const thermostatsDetailsMock = JSON.parse(JSON.stringify(require('../netatmo.loadThermostatDetails.mock.test.json')));
const NetatmoHandler = require('../../../../services/netatmo/lib/index');

const gladys = {};
const serviceId = 'serviceId';
const netatmoHandler = new NetatmoHandler(gladys, serviceId);
const accessToken = 'testAccessToken';

describe('Netatmo Load Thermostat Details', () => {
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

  it('should load thermostat details successfully with API not configured', async () => {
    netatmoHandler.configuration.energyApi = false;

    // Intercept the HTTP/2 call via undici
    netatmoMock
      .intercept({
        method: 'GET',
        path: '/api/getthermostatsdata',
      })
      .reply(200, {
        body: bodyGetThermostatMock,
        status: 'ok',
      });

    const { plugs, thermostats } = await netatmoHandler.loadThermostatDetails();

    expect(plugs).to.deep.eq(thermostatsDetailsMock.plugs);
    expect(thermostats).to.deep.eq(thermostatsDetailsMock.thermostats);
    expect(plugs).to.be.an('array');
    expect(thermostats).to.be.an('array');
  });

  it('should load thermostat details successfully with API configured', async () => {
    netatmoHandler.configuration.energyApi = true;
    thermostatsDetailsMock.plugs.forEach((plug) => {
      plug.apiNotConfigured = false;
      plug.modules.forEach((module) => {
        module.apiNotConfigured = false;
        module.plug.apiNotConfigured = false;
      });
    });
    thermostatsDetailsMock.thermostats.forEach((thermostat) => {
      thermostat.apiNotConfigured = false;
      thermostat.plug.apiNotConfigured = false;
    });

    // Intercept the HTTP/2 call via undici
    netatmoMock
      .intercept({
        method: 'GET',
        path: '/api/getthermostatsdata',
      })
      .reply(200, {
        body: bodyGetThermostatMock,
        status: 'ok',
      });

    const { plugs, thermostats } = await netatmoHandler.loadThermostatDetails();
    expect(plugs).to.deep.eq(thermostatsDetailsMock.plugs);
    expect(thermostats).to.deep.eq(thermostatsDetailsMock.thermostats);
    expect(plugs).to.be.an('array');
    expect(thermostats).to.be.an('array');
  });

  it('should handle API errors gracefully', async () => {
    // Intercept the HTTP/2 call via undici
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

    const { plugs, thermostats } = await netatmoHandler.loadThermostatDetails();

    expect(plugs).to.be.eq(undefined);
    expect(thermostats).to.be.eq(undefined);
  });

  it('should handle unexpected API responses', async () => {
    // Intercept the HTTP/2 call via undici
    netatmoMock
      .intercept({
        method: 'GET',
        path: '/api/getthermostatsdata',
      })
      .reply(200, {
        body: bodyGetThermostatMock,
        status: 'error',
      });

    const { plugs, thermostats } = await netatmoHandler.loadThermostatDetails();
    expect(plugs).to.deep.eq(bodyGetThermostatMock.devices);
    expect(thermostats).to.deep.eq([]);
    expect(plugs).to.be.an('array');
    expect(thermostats).to.be.an('array');
    expect(thermostats).to.have.lengthOf(0);
  });
});
