const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;

const { EVENTS } = require('../../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const NetatmoHandler = require('../../../../services/netatmo/lib/index');

const gladys = {
  event: {
    emit: fake.resolves(null),
  },
  variable: {
    getValue: sinon.fake((variableName, serviceId) => {
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

describe('getRefreshToken', () => {
  beforeEach(() => {
    sinon.reset();

    netatmoHandler.status = 'not_initialized';
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should load the refresh token if available', async () => {
    const refreshToken = await netatmoHandler.getRefreshToken();
    expect(refreshToken).to.equal('valid_refresh_token');
    expect(netatmoHandler.refreshToken).to.equal('valid_refresh_token');
    expect(netatmoHandler.expireInToken).to.equal(10800);
  });

  it('should return undefined and disconnect if no refresh token is available', async () => {
    netatmoHandler.gladys.variable.getValue = fake.returns(null);

    const refreshToken = await netatmoHandler.getRefreshToken();
    expect(refreshToken).to.equal(undefined);
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(1);
    expect(
      netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'disconnected' },
      }),
    ).to.equal(true);
  });

  it('should throw an error if not configured', async () => {
    netatmoHandler.gladys.variable.getValue = sinon.fake((variableName, serviceId) => {
      if (variableName === 'NETATMO_REFRESH_TOKEN') {
        return Promise.resolve('valid_refresh_token');
      }
      if (variableName === 'NETATMO_EXPIRE_IN_TOKEN') {
        return Promise.reject(new Error('Test error'));
      }
      return Promise.reject(new Error('Unknown variable'));
    });

    try {
      await netatmoHandler.getRefreshToken();
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(netatmoHandler.refreshToken).to.equal('valid_refresh_token');
      expect(netatmoHandler.gladys.event.emit.callCount).to.equal(1);
      expect(
        netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
          type: 'netatmo.status',
          payload: { status: 'not_initialized' },
        }),
      ).to.equal(true);
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
      expect(e.message).to.equal('Netatmo is not configured.');
    }
  });
});
