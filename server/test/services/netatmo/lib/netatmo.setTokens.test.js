const { expect } = require('chai');
const sinon = require('sinon');
const { setTokens } = require('../../../../services/netatmo/lib/netatmo.setTokens');
const { NetatmoHandlerMock } = require('../netatmo.mock.test');

describe('Netatmo Set Token', () => {
  beforeEach(() => {
    sinon.reset();

    NetatmoHandlerMock.gladys = {
      variable: {
        setValue: sinon.stub().resolves(),
      },
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should successfully save tokens', async () => {
    const testTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expireIn: 3600,
    };

    const result = await setTokens(NetatmoHandlerMock, testTokens);

    expect(result).to.equal(true);
    expect(NetatmoHandlerMock.accessToken).to.equal('new-access-token');
    expect(NetatmoHandlerMock.refreshToken).to.equal('new-refresh-token');
    expect(NetatmoHandlerMock.expireInToken).to.equal(3600);
    sinon.assert.calledWith(
      NetatmoHandlerMock.gladys.variable.setValue,
      'NETATMO_ACCESS_TOKEN',
      'new-access-token',
      NetatmoHandlerMock.serviceId,
    );
    sinon.assert.calledWith(
      NetatmoHandlerMock.gladys.variable.setValue,
      'NETATMO_REFRESH_TOKEN',
      'new-refresh-token',
      NetatmoHandlerMock.serviceId,
    );
    sinon.assert.calledWith(
      NetatmoHandlerMock.gladys.variable.setValue,
      'NETATMO_EXPIRE_IN_TOKEN',
      3600,
      NetatmoHandlerMock.serviceId,
    );
  });

  it('should handle an error during token save', async () => {
    const testTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expireIn: 3600,
    };

    NetatmoHandlerMock.gladys.variable.setValue
      .withArgs('NETATMO_REFRESH_TOKEN', sinon.match.any)
      .throws(new Error('Failed to save'));

    const result = await setTokens(NetatmoHandlerMock, testTokens);

    expect(result).to.equal(false);
    sinon.assert.calledWith(
      NetatmoHandlerMock.gladys.variable.setValue,
      'NETATMO_ACCESS_TOKEN',
      'new-access-token',
      NetatmoHandlerMock.serviceId,
    );
    sinon.assert.calledWith(
      NetatmoHandlerMock.gladys.variable.setValue,
      'NETATMO_REFRESH_TOKEN',
      'new-refresh-token',
      NetatmoHandlerMock.serviceId,
    );
    sinon.assert.neverCalledWith(
      NetatmoHandlerMock.gladys.variable.setValue,
      'NETATMO_EXPIRE_IN_TOKEN',
      3600,
      NetatmoHandlerMock.serviceId,
    );
  });
});
