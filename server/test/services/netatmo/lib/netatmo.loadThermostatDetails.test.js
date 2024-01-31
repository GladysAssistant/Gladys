const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');

const { fake } = sinon;

const bodyGetThermostatMock = require('../netatmo.getThermostat.mock.test.json');
const thermostatsDetailsMock = require('../netatmo.loadThermostatDetails.mock.test.json');
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

describe('Netatmo Load Thermostat Details', () => {
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

  it('should load thermostat details successfully', async () => {
    nock('https://api.netatmo.com')
      .get('/api/getthermostatsdata')
      .reply(200, { body: bodyGetThermostatMock, status: 'ok' });

    const { thermostats, modules } = await netatmoHandler.loadThermostatDetails();
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

    const { thermostats, modules } = await netatmoHandler.loadThermostatDetails();

    expect(thermostats).to.be.eq(undefined);
    expect(modules).to.be.eq(undefined);
  });

  it('should handle unexpected API responses', async () => {
    nock('https://api.netatmo.com')
      .get('/api/getthermostatsdata')
      .reply(200, { body: bodyGetThermostatMock, status: 'error' });

    const { thermostats, modules } = await netatmoHandler.loadThermostatDetails();
    expect(thermostats).to.deep.eq(thermostatsDetailsMock.thermostats);
    expect(modules).to.deep.eq([]);
    expect(thermostats).to.be.an('array');
    expect(modules).to.be.an('array');
    expect(modules).to.have.lengthOf(0);
  });
});
