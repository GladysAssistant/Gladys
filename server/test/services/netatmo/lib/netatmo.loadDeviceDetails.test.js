const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');
const { loadDeviceDetails } = require('../../../../services/netatmo/lib/netatmo.loadDeviceDetails');
const { NetatmoHandlerMock } = require('../netatmo.mock.test');
const bodyHomesDataMock = require('../netatmo.homesdata.mock.test.json');
const bodyHomeStatusMock = require('../netatmo.homestatus.mock.test.json');
const thermostatsDetailsMock = require('../netatmo.loadThermostatDetails.mock.test.json');

describe('Netatmo Load Device Details', () => {
  const accessToken = 'testAccessToken';
  beforeEach(() => {
    sinon.reset();
    nock.cleanAll();

    NetatmoHandlerMock.status = 'not_initialized';
    NetatmoHandlerMock.accessToken = accessToken;
    NetatmoHandlerMock.loadThermostatDetails = sinon.stub().resolves(thermostatsDetailsMock);
  });

  afterEach(() => {
    sinon.reset();
    nock.cleanAll();
  });

  it('should load device details successfully', async () => {
    const { homes: homesMock } = bodyHomesDataMock;
    nock('https://api.netatmo.com')
      .get('/api/homestatus')
      .reply(200, { body: bodyHomeStatusMock, status: 'ok' });
    const devices = await loadDeviceDetails.call(NetatmoHandlerMock, homesMock[0]);
    expect(devices).to.be.an('array');
  });

  it('should handle API errors gracefully', async () => {
    const { homes: homesMock } = bodyHomesDataMock;
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

    const devices = await loadDeviceDetails.call(NetatmoHandlerMock, homesMock[0]);

    expect(devices).to.be.eq(undefined);
  });

  it('should handle unexpected API responses', async () => {
    const { homes: homesMock } = bodyHomesDataMock;
    nock('https://api.netatmo.com')
      .get('/api/homestatus')
      .reply(200, { body: bodyHomeStatusMock, status: 'error' });

    const devices = await loadDeviceDetails.call(NetatmoHandlerMock, homesMock[0]);
    expect(devices).to.be.an('array');
    expect(devices).to.have.lengthOf(0);
  });
});
