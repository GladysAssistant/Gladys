const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');
const { loadDevices } = require('../../../../services/netatmo/lib/netatmo.loadDevices');
const { NetatmoHandlerMock } = require('../netatmo.mock.test');
const bodyHomesDataMock = require('../netatmo.homesdata.mock.test.json');

describe('Netatmo Load Devices', () => {
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

  it('should load devices successfully', async () => {
    nock('https://api.netatmo.com')
      .get('/api/homesdata')
      .reply(200, { body: bodyHomesDataMock, status: 'ok' });

    const devices = await loadDevices.call(NetatmoHandlerMock);

    expect(devices).to.be.an('array');
  });

  it('should handle API errors gracefully', async () => {
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

    const devices = await loadDevices.call(NetatmoHandlerMock);

    expect(devices).to.be.eq(undefined);
  });

  it('should handle unexpected API responses', async () => {
    nock('https://api.netatmo.com')
      .get('/api/homesdata')
      .reply(200, {
        body: bodyHomesDataMock,
        status: 'error',
      });

    const devices = await loadDevices.call(NetatmoHandlerMock);

    expect(devices).to.be.an('array');
    expect(devices).to.have.lengthOf(0);
  });

  it('should handle API errors gracefully', async () => {
    const badBodyHomesData = bodyHomesDataMock;
    badBodyHomesData.homes[0].modules = undefined;
    nock('https://api.netatmo.com')
      .get('/api/homesdata')
      .reply(200, {
        body: badBodyHomesData,
        status: 'ok',
      });

    const devices = await loadDevices.call(NetatmoHandlerMock);

    expect(devices).to.deep.eq([]);
  });
});
