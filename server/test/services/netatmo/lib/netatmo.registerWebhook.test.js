const { expect } = require('chai');
const sinon = require('sinon');
const { MockAgent, setGlobalDispatcher, getGlobalDispatcher } = require('undici');

const NetatmoHandler = require('../../../../services/netatmo/lib/index');

const gladys = {
  event: {
    emit: sinon.fake.resolves(null),
  },
};
const serviceId = 'serviceId';
const netatmoHandler = new NetatmoHandler(gladys, serviceId);
const webhookUrl = 'https://api.gladysgateway.com/v1/api/netatmo/my-open-api-key';

describe('Netatmo Register Webhook', () => {
  let mockAgent;
  let netatmoMock;
  let originalDispatcher;

  beforeEach(() => {
    sinon.reset();

    // Store the original dispatcher
    originalDispatcher = getGlobalDispatcher();

    // MockAgent setup
    mockAgent = new MockAgent();
    setGlobalDispatcher(mockAgent);
    mockAgent.disableNetConnect();
    netatmoMock = mockAgent.get('https://api.netatmo.com');

    netatmoHandler.status = 'connected';
    netatmoHandler.accessToken = 'valid_access_token';
    netatmoHandler.configuration.webhookUrl = webhookUrl;
    netatmoHandler.webhookRegistered = false;
  });

  afterEach(() => {
    sinon.reset();
    // Clean up the mock agent
    mockAgent.close();
    // Restore the original dispatcher
    setGlobalDispatcher(originalDispatcher);
  });

  it('should register the webhook successfully', async () => {
    // Intercept the HTTP/2 call via undici
    netatmoMock
      .intercept({
        method: 'POST',
        path: `/api/addwebhook?url=${encodeURIComponent(webhookUrl)}`,
        headers: {
          Authorization: 'Bearer valid_access_token',
        },
      })
      .reply(200, { status: 'ok' });

    const result = await netatmoHandler.registerWebhook();

    expect(result).to.equal(true);
    expect(netatmoHandler.webhookRegistered).to.equal(true);
  });

  it('should skip the registration when no webhook URL is configured', async () => {
    netatmoHandler.configuration.webhookUrl = '   ';

    const result = await netatmoHandler.registerWebhook();

    expect(result).to.equal(false);
    expect(netatmoHandler.webhookRegistered).to.equal(false);
  });

  it('should skip the registration when the webhook URL is null', async () => {
    netatmoHandler.configuration.webhookUrl = null;

    const result = await netatmoHandler.registerWebhook();

    expect(result).to.equal(false);
    expect(netatmoHandler.webhookRegistered).to.equal(false);
  });

  it('should skip the registration when there is no access token', async () => {
    netatmoHandler.accessToken = null;

    const result = await netatmoHandler.registerWebhook();

    expect(result).to.equal(false);
    expect(netatmoHandler.webhookRegistered).to.equal(false);
  });

  it('should not throw when the Netatmo API rejects the registration', async () => {
    // Intercept the HTTP/2 call via undici
    netatmoMock
      .intercept({
        method: 'POST',
        path: `/api/addwebhook?url=${encodeURIComponent(webhookUrl)}`,
      })
      .reply(400, { error: { code: 7, message: 'Application banned from webhooks' } });

    const result = await netatmoHandler.registerWebhook();

    expect(result).to.equal(false);
    expect(netatmoHandler.webhookRegistered).to.equal(false);
  });

  it('should not throw on a network error', async () => {
    netatmoHandler.webhookRegistered = true;
    // Intercept the HTTP/2 call via undici
    netatmoMock
      .intercept({
        method: 'POST',
        path: `/api/addwebhook?url=${encodeURIComponent(webhookUrl)}`,
      })
      .replyWithError(new Error('Network error'));

    const result = await netatmoHandler.registerWebhook();

    expect(result).to.equal(false);
    expect(netatmoHandler.webhookRegistered).to.equal(false);
  });
});
