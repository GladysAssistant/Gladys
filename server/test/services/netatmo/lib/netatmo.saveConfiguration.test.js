const { expect } = require('chai');
const sinon = require('sinon');
const { saveConfiguration } = require('../../../../services/netatmo/lib/netatmo.saveConfiguration');
const { NetatmoHandlerMock } = require('../netatmo.mock.test');
const netatmoStatus = require('../../../../services/netatmo/lib/netatmo.status');
// const netatmoSetTokens = require('../../../../services/netatmo/lib/netatmo.setTokens');

describe('Netatmo Save configuration', () => {
  beforeEach(() => {
    sinon.reset();

    NetatmoHandlerMock.saveStatus = sinon.stub().callsFake(netatmoStatus.saveStatus);
    // NetatmoHandlerMock.setTokens = sinon.stub().callsFake(netatmoSetTokens.setTokens);
    NetatmoHandlerMock.status = 'not_initialized';
    NetatmoHandlerMock.gladys = {
      variable: {
        setValue: sinon.stub().resolves(),
      },
    };
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should successfully save the configuration', async () => {
    const testConfig = {
      clientId: 'new-client-id',
      clientSecret: 'new-client-secret',
    };
    const result = await saveConfiguration.call(NetatmoHandlerMock, testConfig);

    expect(result).to.equal(true);
    expect(NetatmoHandlerMock.configuration.clientId).to.equal('new-client-id');
    expect(NetatmoHandlerMock.configuration.clientSecret).to.equal('new-client-secret');
    sinon.assert.calledWith(
      NetatmoHandlerMock.gladys.variable.setValue,
      'NETATMO_CLIENT_ID',
      'new-client-id',
      NetatmoHandlerMock.serviceId,
    );
    sinon.assert.calledWith(
      NetatmoHandlerMock.gladys.variable.setValue,
      'NETATMO_CLIENT_SECRET',
      'new-client-secret',
      NetatmoHandlerMock.serviceId,
    );
  });

  it('should handle an error during configuration save', async () => {
    const testConfig = {
      clientId: 'new-client-id',
      clientSecret: 'new-client-secret',
    };
    NetatmoHandlerMock.gladys.variable.setValue
      .withArgs('NETATMO_CLIENT_ID', sinon.match.any)
      .throws(new Error('Failed to save'));
    const result = await saveConfiguration.call(NetatmoHandlerMock, testConfig);

    expect(result).to.equal(false);
    sinon.assert.calledWith(
      NetatmoHandlerMock.gladys.variable.setValue,
      'NETATMO_CLIENT_ID',
      'new-client-id',
      NetatmoHandlerMock.serviceId,
    );
    sinon.assert.neverCalledWith(
      NetatmoHandlerMock.gladys.variable.setValue,
      'NETATMO_CLIENT_SECRET',
      'new-client-secret',
      NetatmoHandlerMock.serviceId,
    );
  });
});
