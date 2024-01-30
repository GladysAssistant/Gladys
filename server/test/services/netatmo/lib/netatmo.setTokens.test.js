const { expect } = require('chai');
const sinon = require('sinon');

const NetatmoHandler = require('../../../../services/netatmo/lib/index');

const gladys = {
  variable: {
    setValue: sinon.stub().resolves(),
  },
};
const serviceId = 'serviceId';
const netatmoHandler = new NetatmoHandler(gladys, serviceId);

describe('Netatmo Set Token', () => {
  beforeEach(() => {
    sinon.reset();
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

    const result = await netatmoHandler.setTokens(testTokens);

    expect(result).to.equal(true);
    expect(netatmoHandler.accessToken).to.equal('new-access-token');
    expect(netatmoHandler.refreshToken).to.equal('new-refresh-token');
    expect(netatmoHandler.expireInToken).to.equal(3600);
    sinon.assert.calledWith(
      netatmoHandler.gladys.variable.setValue,
      'NETATMO_ACCESS_TOKEN',
      'new-access-token',
      netatmoHandler.serviceId,
    );
    sinon.assert.calledWith(
      netatmoHandler.gladys.variable.setValue,
      'NETATMO_REFRESH_TOKEN',
      'new-refresh-token',
      netatmoHandler.serviceId,
    );
    sinon.assert.calledWith(
      netatmoHandler.gladys.variable.setValue,
      'NETATMO_EXPIRE_IN_TOKEN',
      3600,
      netatmoHandler.serviceId,
    );
  });

  it('should handle an error during token save', async () => {
    const testTokens = {
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      expireIn: 3600,
    };

    netatmoHandler.gladys.variable.setValue
      .withArgs('NETATMO_REFRESH_TOKEN', sinon.match.any)
      .throws(new Error('Failed to save'));

    const result = await netatmoHandler.setTokens(testTokens);

    expect(result).to.equal(false);
    sinon.assert.calledWith(
      netatmoHandler.gladys.variable.setValue,
      'NETATMO_ACCESS_TOKEN',
      'new-access-token',
      netatmoHandler.serviceId,
    );
    sinon.assert.calledWith(
      netatmoHandler.gladys.variable.setValue,
      'NETATMO_REFRESH_TOKEN',
      'new-refresh-token',
      netatmoHandler.serviceId,
    );
    sinon.assert.neverCalledWith(
      netatmoHandler.gladys.variable.setValue,
      'NETATMO_EXPIRE_IN_TOKEN',
      3600,
      netatmoHandler.serviceId,
    );
  });
});
