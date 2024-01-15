const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');

const { fake } = sinon;

const deviceDetailsMock = require('../netatmo.loadDevicesDetails.mock.test.json');
const bodyHomesDataMock = require('../netatmo.homesdata.mock.test.json');
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

describe('Netatmo Load Devices', () => {
  beforeEach(() => {
    sinon.reset();
    nock.cleanAll();

    netatmoHandler.status = 'not_initialized';
    netatmoHandler.accessToken = accessToken;
    netatmoHandler.loadDeviceDetails = sinon.stub().resolves(deviceDetailsMock);
  });

  afterEach(() => {
    sinon.reset();
    nock.cleanAll();
  });

  it('should load devices successfully', async () => {
    nock('https://api.netatmo.com')
      .get('/api/homesdata')
      .reply(200, { body: bodyHomesDataMock, status: 'ok' });

    const devices = await netatmoHandler.loadDevices();

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

    const devices = await netatmoHandler.loadDevices();

    expect(devices).to.be.eq(undefined);
  });

  it('should handle unexpected API responses', async () => {
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
    const badBodyHomesData = JSON.parse(JSON.stringify(bodyHomesDataMock));
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
    const bodyHomesDataEmpty = JSON.parse(JSON.stringify(bodyHomesDataMock));
    bodyHomesDataEmpty.homes = [];

    nock('https://api.netatmo.com')
      .get('/api/homesdata')
      .reply(200, { body: bodyHomesDataEmpty, status: 'ok' });

    const devices = await netatmoHandler.loadDevices();

    expect(devices).to.deep.eq([]);
  });

  it('should return an empty array if homes are returned without modules', async () => {
    const bodyHomesDataNoModules = JSON.parse(JSON.stringify(bodyHomesDataMock));
    bodyHomesDataNoModules.homes.forEach((home) => {
      home.modules = undefined;
    });

    nock('https://api.netatmo.com')
      .get('/api/homesdata')
      .reply(200, { body: bodyHomesDataNoModules, status: 'ok' });

    const devices = await netatmoHandler.loadDevices();

    expect(devices).to.deep.eq([]);
  });
});
