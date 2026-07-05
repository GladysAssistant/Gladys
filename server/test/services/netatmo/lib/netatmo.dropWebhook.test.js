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

describe('Netatmo Drop Webhook', () => {
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
    netatmoHandler.webhookRegistered = true;
  });

  afterEach(() => {
    sinon.reset();
    // Clean up the mock agent
    mockAgent.close();
    // Restore the original dispatcher
    setGlobalDispatcher(originalDispatcher);
  });

  it('should drop the webhook successfully', async () => {
    // Intercept the HTTP/2 call via undici
    netatmoMock
      .intercept({
        method: 'POST',
        path: '/api/dropwebhook',
        headers: {
          Authorization: 'Bearer valid_access_token',
        },
      })
      .reply(200, { status: 'ok' });

    const result = await netatmoHandler.dropWebhook();

    expect(result).to.equal(true);
    expect(netatmoHandler.webhookRegistered).to.equal(false);
  });

  it('should skip the unregistration when there is no access token', async () => {
    netatmoHandler.accessToken = null;

    const result = await netatmoHandler.dropWebhook();

    expect(result).to.equal(false);
    expect(netatmoHandler.webhookRegistered).to.equal(false);
  });

  it('should not throw when the Netatmo API rejects the unregistration', async () => {
    // Intercept the HTTP/2 call via undici
    netatmoMock
      .intercept({
        method: 'POST',
        path: '/api/dropwebhook',
      })
      .reply(400, { error: { code: 21, message: 'Invalid argument' } });

    const result = await netatmoHandler.dropWebhook();

    expect(result).to.equal(false);
    expect(netatmoHandler.webhookRegistered).to.equal(false);
  });

  it('should not throw on a network error', async () => {
    // Intercept the HTTP/2 call via undici
    netatmoMock
      .intercept({
        method: 'POST',
        path: '/api/dropwebhook',
      })
      .replyWithError(new Error('Network error'));

    const result = await netatmoHandler.dropWebhook();

    expect(result).to.equal(false);
    expect(netatmoHandler.webhookRegistered).to.equal(false);
  });
});
