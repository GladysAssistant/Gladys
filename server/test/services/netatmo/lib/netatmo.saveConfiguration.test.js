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

describe('Netatmo Save configuration', () => {
  beforeEach(() => {
    sinon.reset();

    netatmoHandler.status = 'not_initialized';
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should successfully save the configuration', async () => {
    const testConfig = {
      clientId: 'new-client-id',
      clientSecret: 'new-client-secret',
    };
    const result = await netatmoHandler.saveConfiguration(testConfig);

    expect(result).to.equal(true);
    expect(netatmoHandler.configuration.clientId).to.equal('new-client-id');
    expect(netatmoHandler.configuration.clientSecret).to.equal('new-client-secret');
    sinon.assert.calledWith(
      netatmoHandler.gladys.variable.setValue,
      'NETATMO_CLIENT_ID',
      'new-client-id',
      netatmoHandler.serviceId,
    );
    sinon.assert.calledWith(
      netatmoHandler.gladys.variable.setValue,
      'NETATMO_CLIENT_SECRET',
      'new-client-secret',
      netatmoHandler.serviceId,
    );
  });

  it('should handle an error during configuration save', async () => {
    const testConfig = {
      clientId: 'new-client-id',
      clientSecret: 'new-client-secret',
    };
    netatmoHandler.gladys.variable.setValue
      .withArgs('NETATMO_CLIENT_ID', sinon.match.any)
      .throws(new Error('Failed to save'));
    const result = await netatmoHandler.saveConfiguration(testConfig);

    expect(result).to.equal(false);
    sinon.assert.calledWith(
      netatmoHandler.gladys.variable.setValue,
      'NETATMO_CLIENT_ID',
      'new-client-id',
      netatmoHandler.serviceId,
    );
    sinon.assert.neverCalledWith(
      netatmoHandler.gladys.variable.setValue,
      'NETATMO_CLIENT_SECRET',
      'new-client-secret',
      netatmoHandler.serviceId,
    );
  });
});
