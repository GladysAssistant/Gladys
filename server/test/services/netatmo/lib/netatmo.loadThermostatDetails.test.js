const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');
const { loadThermostatDetails } = require('../../../../services/netatmo/lib/netatmo.loadThermostatDetails');
const { NetatmoHandlerMock } = require('../netatmo.mock.test');
const bodyGetThermostatMock = require('../netatmo.getThermostat.mock.test.json');
const thermostatsDetailsMock = require('../netatmo.loadThermostatDetails.mock.test.json');

describe('Netatmo Load Thermostat Details', () => {
  const accessToken = 'testAccessToken';
  beforeEach(() => {
    sinon.reset();
    nock.cleanAll();

    NetatmoHandlerMock.status = 'not_initialized';
    NetatmoHandlerMock.accessToken = accessToken;
  });

  afterEach(() => {
    sinon.reset();
    nock.cleanAll();
  });

  it('should load thermostat details successfully', async () => {
    nock('https://api.netatmo.com')
      .get('/api/getthermostatsdata')
      .reply(200, { body: bodyGetThermostatMock, status: 'ok' });

    const { thermostats, modules } = await loadThermostatDetails.call(NetatmoHandlerMock);
    expect(thermostats).to.deep.eq(thermostatsDetailsMock.thermostats);
    expect(modules).to.deep.eq(thermostatsDetailsMock.modules);
    expect(thermostats).to.be.an('array');
    expect(modules).to.be.an('array');
  });

  it('should handle API errors gracefully', async () => {
    nock('https://api.netatmo.com')
      .get('/api/getthermostatsdata')
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

    const { thermostats, modules } = await loadThermostatDetails.call(NetatmoHandlerMock);

    expect(thermostats).to.be.eq(undefined);
    expect(modules).to.be.eq(undefined);
  });

  it('should handle unexpected API responses', async () => {
    nock('https://api.netatmo.com')
      .get('/api/getthermostatsdata')
      .reply(200, { body: bodyGetThermostatMock, status: 'error' });

    const { thermostats, modules } = await loadThermostatDetails.call(NetatmoHandlerMock);
    expect(thermostats).to.deep.eq(thermostatsDetailsMock.thermostats);
    expect(modules).to.deep.eq([]);
    expect(thermostats).to.be.an('array');
    expect(modules).to.be.an('array');
    expect(modules).to.have.lengthOf(0);
  });
});
