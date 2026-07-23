const EventEmitter = require('events');
const { expect } = require('chai');
const sinon = require('sinon');
const WebSocket = require('ws');
const { assert: sinonAssert, fake } = require('sinon');

const { ExternalIntegrationUnavailableError, BadParameters } = require('../../../utils/coreErrors');
const { Error422 } = require('../../../utils/httpErrors');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../../utils/constants');
const { buildSupervisor, seedExternalService, TEST_MANIFEST } = require('./testUtils.test');

// manifest of a cloud integration with an oauth2 config field (Netatmo case)
const TEST_OAUTH_MANIFEST = {
  ...TEST_MANIFEST,
  config_schema: [
    ...TEST_MANIFEST.config_schema,
    {
      key: 'netatmo_account',
      type: 'oauth2',
      label: { en: 'Netatmo account', fr: 'Compte Netatmo' },
    },
  ],
};

const REDIRECT_URI = 'https://my-gladys/dashboard/integration/device/external/ext-dev-demo/oauth-callback';

const buildFakeWs = () => {
  const ws = new EventEmitter();
  ws.readyState = WebSocket.OPEN;
  ws.send = fake.returns(null);
  ws.ping = fake.returns(null);
  ws.terminate = fake.returns(null);
  return ws;
};

const seedOAuthService = (overrides = {}) => seedExternalService({ manifest: TEST_OAUTH_MANIFEST, ...overrides });

// the relays await a (stubbed) getBySelector before sending the command:
// flush the microtask queue until the fake socket has really been written to
const waitForSend = async (ws) => {
  for (let i = 0; i < 20 && !ws.send.called; i += 1) {
    // eslint-disable-next-line no-await-in-loop
    await Promise.resolve();
  }
  expect(ws.send.called).to.equal(true);
};

describe('externalIntegration.getOAuthAuthorizeUrl', () => {
  let clock;

  afterEach(() => {
    if (clock) {
      clock.restore();
      clock = null;
    }
  });

  it('should relay the request and resolve with the URL built by the integration', async () => {
    const service = await seedOAuthService();
    const { externalIntegration } = buildSupervisor();
    const ws = buildFakeWs();
    externalIntegration.connections.set(service.id, ws);
    externalIntegration.getBySelector = fake.resolves(service);
    const resultPromise = externalIntegration.getOAuthAuthorizeUrl(service.selector, {
      key: 'netatmo_account',
      redirect_uri: REDIRECT_URI,
    });
    await waitForSend(ws);
    sinonAssert.calledOnce(ws.send);
    const sentMessage = JSON.parse(ws.send.firstCall.args[0]);
    expect(sentMessage.type).to.equal(WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.OAUTH_GET_AUTHORIZE_URL);
    expect(sentMessage.payload).to.have.property('message_id');
    expect(sentMessage.payload).to.have.property('key', 'netatmo_account');
    expect(sentMessage.payload).to.have.property('redirect_uri', REDIRECT_URI);
    // the integration answers through command-result data
    externalIntegration.handleCommandResult(service, {
      message_id: sentMessage.payload.message_id,
      success: true,
      data: { authorize_url: 'https://api.netatmo.com/oauth2/authorize?client_id=abc&state=xyz' },
    });
    const result = await resultPromise;
    expect(result).to.deep.equal({
      authorize_url: 'https://api.netatmo.com/oauth2/authorize?client_id=abc&state=xyz',
    });
  });

  it('should reject when the integration answers without an authorize_url', async () => {
    const service = await seedOAuthService();
    const { externalIntegration } = buildSupervisor();
    const ws = buildFakeWs();
    externalIntegration.connections.set(service.id, ws);
    externalIntegration.getBySelector = fake.resolves(service);
    const resultPromise = externalIntegration.getOAuthAuthorizeUrl(service.selector, {
      key: 'netatmo_account',
      redirect_uri: REDIRECT_URI,
    });
    await waitForSend(ws);
    const sentMessage = JSON.parse(ws.send.firstCall.args[0]);
    externalIntegration.handleCommandResult(service, { message_id: sentMessage.payload.message_id, success: true });
    try {
      await resultPromise;
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(ExternalIntegrationUnavailableError);
      expect(e.message).to.equal('EXTERNAL_INTEGRATION_INVALID_OAUTH_RESPONSE');
    }
  });

  it('should reject after the ack timeout', async () => {
    const service = await seedOAuthService();
    const { externalIntegration } = buildSupervisor();
    const ws = buildFakeWs();
    externalIntegration.connections.set(service.id, ws);
    // resolve the service outside the fake clock (the DB fetch needs the
    // real event loop), so the command timer is registered on the fake one
    externalIntegration.getBySelector = fake.resolves(service);
    clock = sinon.useFakeTimers();
    const resultPromise = externalIntegration.getOAuthAuthorizeUrl(service.selector, {
      key: 'netatmo_account',
      redirect_uri: REDIRECT_URI,
    });
    const assertionPromise = resultPromise.then(
      () => {
        throw new Error('should have thrown');
      },
      (e) => {
        expect(e).to.be.instanceOf(ExternalIntegrationUnavailableError);
        expect(e.message).to.equal('EXTERNAL_INTEGRATION_COMMAND_TIMEOUT');
      },
    );
    await clock.tickAsync(5001);
    clock.restore();
    clock = null;
    await assertionPromise;
  });

  it('should throw when the integration is disconnected', async () => {
    const service = await seedOAuthService();
    const { externalIntegration } = buildSupervisor();
    try {
      await externalIntegration.getOAuthAuthorizeUrl(service.selector, {
        key: 'netatmo_account',
        redirect_uri: REDIRECT_URI,
      });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(ExternalIntegrationUnavailableError);
      expect(e.message).to.equal('EXTERNAL_INTEGRATION_NOT_CONNECTED');
    }
  });

  it('should refuse a key that is not an oauth2 field', async () => {
    const service = await seedOAuthService();
    const { externalIntegration } = buildSupervisor();
    await Promise.all(
      ['latitude', 'unknown_key'].map(async (key) => {
        try {
          await externalIntegration.getOAuthAuthorizeUrl(service.selector, { key, redirect_uri: REDIRECT_URI });
          throw new Error('should have thrown');
        } catch (e) {
          expect(e).to.be.instanceOf(BadParameters);
          expect(e.message).to.include('not an oauth2 field');
        }
      }),
    );
  });

  it('should refuse malformed parameters', async () => {
    const { externalIntegration } = buildSupervisor();
    await Promise.all(
      [{}, { key: 'netatmo_account' }, { redirect_uri: REDIRECT_URI }, { key: '', redirect_uri: '' }].map(
        async (params) => {
          try {
            await externalIntegration.getOAuthAuthorizeUrl('ext-dev-open-meteo-demo', params);
            throw new Error('should have thrown');
          } catch (e) {
            expect(e).to.be.instanceOf(BadParameters);
          }
        },
      ),
    );
  });
});

describe('externalIntegration.relayOAuthCallback', () => {
  const CALLBACK_PARAMS = {
    key: 'netatmo_account',
    code: 'auth-code',
    state: 'anti-csrf-state',
    redirect_uri: REDIRECT_URI,
  };

  it('should relay the provider redirect to the integration', async () => {
    const service = await seedOAuthService();
    const { externalIntegration } = buildSupervisor();
    const ws = buildFakeWs();
    externalIntegration.connections.set(service.id, ws);
    externalIntegration.getBySelector = fake.resolves(service);
    const resultPromise = externalIntegration.relayOAuthCallback(service.selector, CALLBACK_PARAMS);
    await waitForSend(ws);
    const sentMessage = JSON.parse(ws.send.firstCall.args[0]);
    expect(sentMessage.type).to.equal(WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.OAUTH_CALLBACK);
    expect(sentMessage.payload).to.have.property('message_id');
    expect(sentMessage.payload).to.have.property('key', 'netatmo_account');
    expect(sentMessage.payload).to.have.property('code', 'auth-code');
    expect(sentMessage.payload).to.have.property('state', 'anti-csrf-state');
    expect(sentMessage.payload).to.have.property('redirect_uri', REDIRECT_URI);
    externalIntegration.handleCommandResult(service, { message_id: sentMessage.payload.message_id, success: true });
    const result = await resultPromise;
    expect(result).to.deep.equal({ success: true });
  });

  it('should turn an explicit failure of the integration into a 422 with its message', async () => {
    const service = await seedOAuthService();
    const { externalIntegration } = buildSupervisor();
    const ws = buildFakeWs();
    externalIntegration.connections.set(service.id, ws);
    externalIntegration.getBySelector = fake.resolves(service);
    const resultPromise = externalIntegration.relayOAuthCallback(service.selector, CALLBACK_PARAMS);
    await waitForSend(ws);
    const sentMessage = JSON.parse(ws.send.firstCall.args[0]);
    externalIntegration.handleCommandResult(service, {
      message_id: sentMessage.payload.message_id,
      success: false,
      error: 'invalid state',
    });
    try {
      await resultPromise;
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(Error422);
      // the detail of an Error422 lives in its properties, not its message
      expect(e.properties).to.include('invalid state');
    }
  });

  it('should keep a disconnected integration as a transport error, not a 422', async () => {
    const service = await seedOAuthService();
    const { externalIntegration } = buildSupervisor();
    try {
      await externalIntegration.relayOAuthCallback(service.selector, CALLBACK_PARAMS);
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(ExternalIntegrationUnavailableError);
      expect(e.message).to.equal('EXTERNAL_INTEGRATION_NOT_CONNECTED');
    }
  });

  it('should refuse a key that is not an oauth2 field', async () => {
    const service = await seedOAuthService();
    const { externalIntegration } = buildSupervisor();
    try {
      await externalIntegration.relayOAuthCallback(service.selector, { ...CALLBACK_PARAMS, key: 'latitude' });
      throw new Error('should have thrown');
    } catch (e) {
      expect(e).to.be.instanceOf(BadParameters);
      expect(e.message).to.include('not an oauth2 field');
    }
  });

  it('should refuse malformed parameters', async () => {
    const { externalIntegration } = buildSupervisor();
    const invalidParams = [
      {},
      { ...CALLBACK_PARAMS, code: undefined },
      { ...CALLBACK_PARAMS, state: '' },
      { ...CALLBACK_PARAMS, redirect_uri: 42 },
    ];
    await Promise.all(
      invalidParams.map(async (params) => {
        try {
          await externalIntegration.relayOAuthCallback('ext-dev-open-meteo-demo', params);
          throw new Error('should have thrown');
        } catch (e) {
          expect(e).to.be.instanceOf(BadParameters);
        }
      }),
    );
  });
});

describe('externalIntegration.setConnectionStatus / getConnectionStatus', () => {
  it('should store the status in memory and push it to the frontend', async () => {
    const service = await seedOAuthService();
    const { externalIntegration, event } = buildSupervisor();
    const message = { en: 'Token expired, please reconnect.', fr: 'Token expiré, reconnectez-vous.' };
    const stored = externalIntegration.setConnectionStatus(service, { connected: false, message });
    expect(stored).to.deep.equal({ connected: false, message });
    expect(externalIntegration.getConnectionStatus(service.id)).to.deep.equal({ connected: false, message });
    sinonAssert.calledWith(event.emit, 'websocket.send-all', {
      type: WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.CONNECTION_STATUS_UPDATED,
      payload: {
        selector: service.selector,
        connected: false,
        message,
      },
    });
  });

  it('should accept a status without message', async () => {
    const service = await seedOAuthService();
    const { externalIntegration } = buildSupervisor();
    externalIntegration.setConnectionStatus(service, { connected: true });
    expect(externalIntegration.getConnectionStatus(service.id)).to.deep.equal({ connected: true, message: null });
  });

  it('should return null when the integration never published a status', async () => {
    const { externalIntegration } = buildSupervisor();
    expect(externalIntegration.getConnectionStatus('7c9f16e0-3ecd-4b96-a2a4-6ae0c5ba536d')).to.equal(null);
  });

  it('should refuse a malformed status', async () => {
    const service = await seedOAuthService();
    const { externalIntegration } = buildSupervisor();
    const invalidStatuses = [
      undefined,
      {},
      { connected: 'yes' },
      { connected: true, message: 'flat string' },
      { connected: true, message: ['array'] },
      { connected: true, message: { fr: 'sans anglais' } },
      { connected: true, message: { en: 'ok', fr: 42 } },
    ];
    invalidStatuses.forEach((status) => {
      try {
        externalIntegration.setConnectionStatus(service, status);
        throw new Error('should have thrown');
      } catch (e) {
        expect(e).to.be.instanceOf(BadParameters);
      }
    });
  });

  it('should forget the status at uninstall', async () => {
    const service = await seedOAuthService({ container_id: null });
    const { externalIntegration } = buildSupervisor();
    externalIntegration.setConnectionStatus(service, { connected: true });
    await externalIntegration.uninstall(service.selector);
    expect(externalIntegration.getConnectionStatus(service.id)).to.equal(null);
  });
});
