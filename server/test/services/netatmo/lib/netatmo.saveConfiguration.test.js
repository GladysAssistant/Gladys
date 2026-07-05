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
    netatmoHandler.configuration.webhookUrl = null;
    netatmoHandler.registerWebhook = sinon.stub().resolves(true);
    netatmoHandler.dropWebhook = sinon.stub().resolves(true);
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

  it('should store the trimmed webhook URL without registering when not connected', async () => {
    const result = await netatmoHandler.saveConfiguration({
      webhookUrl: '  https://api.gladysgateway.com/v1/api/netatmo/my-key  ',
    });

    expect(result).to.equal(true);
    expect(netatmoHandler.configuration.webhookUrl).to.equal('https://api.gladysgateway.com/v1/api/netatmo/my-key');
    sinon.assert.calledWith(
      netatmoHandler.gladys.variable.setValue,
      'NETATMO_WEBHOOK_URL',
      'https://api.gladysgateway.com/v1/api/netatmo/my-key',
      netatmoHandler.serviceId,
    );
    sinon.assert.notCalled(netatmoHandler.registerWebhook);
    sinon.assert.notCalled(netatmoHandler.dropWebhook);
  });

  it('should register the webhook when the URL is added while connected', async () => {
    netatmoHandler.status = 'connected';

    const result = await netatmoHandler.saveConfiguration({
      webhookUrl: 'https://api.gladysgateway.com/v1/api/netatmo/my-key',
    });

    expect(result).to.equal(true);
    sinon.assert.calledOnce(netatmoHandler.registerWebhook);
    sinon.assert.notCalled(netatmoHandler.dropWebhook);
  });

  it('should drop the webhook when the URL is cleared while connected', async () => {
    netatmoHandler.status = 'connected';
    netatmoHandler.configuration.webhookUrl = 'https://api.gladysgateway.com/v1/api/netatmo/my-key';

    const result = await netatmoHandler.saveConfiguration({ webhookUrl: '' });

    expect(result).to.equal(true);
    sinon.assert.calledOnce(netatmoHandler.dropWebhook);
    sinon.assert.notCalled(netatmoHandler.registerWebhook);
  });

  it('should not touch the webhook when the URL is unchanged while connected', async () => {
    netatmoHandler.status = 'connected';
    netatmoHandler.configuration.webhookUrl = 'https://api.gladysgateway.com/v1/api/netatmo/my-key';

    const result = await netatmoHandler.saveConfiguration({
      webhookUrl: 'https://api.gladysgateway.com/v1/api/netatmo/my-key',
    });

    expect(result).to.equal(true);
    sinon.assert.notCalled(netatmoHandler.registerWebhook);
    sinon.assert.notCalled(netatmoHandler.dropWebhook);
  });

  it('should still save the configuration when the webhook registration rejects', async () => {
    netatmoHandler.status = 'connected';
    netatmoHandler.registerWebhook = sinon.stub().rejects(new Error('addwebhook error'));

    const result = await netatmoHandler.saveConfiguration({
      webhookUrl: 'https://api.gladysgateway.com/v1/api/netatmo/my-key',
    });

    expect(result).to.equal(true);
    sinon.assert.calledOnce(netatmoHandler.registerWebhook);
  });
});
