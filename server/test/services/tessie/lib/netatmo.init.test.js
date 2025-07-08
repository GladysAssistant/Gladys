const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;

const NetatmoHandler = require('../../../../services/netatmo/lib/index');

const gladys = {
  event: {
    emit: fake.resolves(null),
  },
  variable: {
    getValue: sinon.fake((variableName, serviceId) => {
      if (variableName === 'NETATMO_CLIENT_ID') {
        return Promise.resolve('valid_client_id');
      }
      if (variableName === 'NETATMO_CLIENT_SECRET') {
        return Promise.resolve('valid_client_secret');
      }
      if (variableName === 'NETATMO_ACCESS_TOKEN') {
        return Promise.resolve('valid_access_token');
      }
      if (variableName === 'NETATMO_REFRESH_TOKEN') {
        return Promise.resolve('valid_refresh_token');
      }
      if (variableName === 'NETATMO_EXPIRE_IN_TOKEN') {
        return Promise.resolve(10800);
      }
      return Promise.reject(new Error('Unknown variable'));
    }),
    setValue: sinon.stub().resolves(),
  },
};
const serviceIdFake = 'serviceId';
const netatmoHandler = new NetatmoHandler(gladys, serviceIdFake);
netatmoHandler.pollRefreshingToken = fake.resolves(null);
netatmoHandler.pollRefreshingValues = fake.resolves(null);

describe('Netatmo Init', () => {
  beforeEach(() => {
    sinon.reset();

    netatmoHandler.status = 'not_initialized';
    netatmoHandler.gladys.variable.getValue = sinon.fake((variableName, serviceId) => {
      if (variableName === 'NETATMO_CLIENT_ID') {
        return Promise.resolve('valid_client_id');
      }
      if (variableName === 'NETATMO_CLIENT_SECRET') {
        return Promise.resolve('valid_client_secret');
      }
      if (variableName === 'NETATMO_ENERGY_API') {
        return Promise.resolve('1');
      }
      if (variableName === 'NETATMO_WEATHER_API') {
        return Promise.resolve('0');
      }
      if (variableName === 'NETATMO_ACCESS_TOKEN') {
        return Promise.resolve('valid_access_token');
      }
      if (variableName === 'NETATMO_REFRESH_TOKEN') {
        return Promise.resolve('valid_refresh_token');
      }
      if (variableName === 'NETATMO_EXPIRE_IN_TOKEN') {
        return Promise.resolve(10800);
      }
      return Promise.reject(new Error('Unknown variable'));
    });
    netatmoHandler.refreshingTokens = fake.resolves({ success: true });
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should handle valid access and refresh tokens', async () => {
    netatmoHandler.configuration.clientId = 'valid_client_id';
    netatmoHandler.configuration.clientSecret = 'valid_client_secret';
    netatmoHandler.configuration.energyApi = true;
    netatmoHandler.configuration.weatherApi = false;
    netatmoHandler.accessToken = 'valid_access_token';
    netatmoHandler.refreshToken = 'valid_refresh_token';

    await netatmoHandler.init();

    expect(netatmoHandler.refreshingTokens.called).to.equal(true);
    expect(netatmoHandler.pollRefreshingToken.called).to.equal(true);
    expect(netatmoHandler.pollRefreshingValues.called).to.equal(true);
  });

  it('should handle failed token refresh', async () => {
    netatmoHandler.refreshingTokens = fake.resolves({ success: false });

    await netatmoHandler.init();

    expect(netatmoHandler.refreshingTokens.called).to.equal(true);
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(0);
  });
});
