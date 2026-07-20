const { expect } = require('chai');
const sinon = require('sinon');
const { MockAgent, setGlobalDispatcher, getGlobalDispatcher } = require('undici');

const { fake } = sinon;

const { EVENTS } = require('../../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const NetatmoHandler = require('../../../../services/netatmo/lib/index');

const gladys = {
  event: {
    emit: fake.resolves(null),
  },
  variable: {
    setValue: fake.resolves(null),
  },
};
const serviceId = 'serviceId';
const netatmoHandler = new NetatmoHandler(gladys, serviceId);

describe('Netatmo Refreshing Tokens', () => {
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

    netatmoHandler.configuration = {
      clientId: 'valid_client_id',
      clientSecret: 'valid_client_secret',
      scopes: { scopeEnergy: 'scope' },
    };
    netatmoHandler.accessToken = 'valid_access_token';
    netatmoHandler.refreshToken = 'valid_refresh_token';
    netatmoHandler.status = 'not_initialized';
    netatmoHandler.firstFatalAt = null;
  });

  afterEach(() => {
    sinon.reset();
    // Clean up the mock agent
    mockAgent.close();
    // Restore the original dispatcher
    setGlobalDispatcher(originalDispatcher);
  });

  it('should throw an error if configuration are missing', async () => {
    netatmoHandler.configuration.clientId = null;
    netatmoHandler.configuration.clientSecret = null;

    try {
      await netatmoHandler.refreshingTokens();
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
      expect(e.message).to.equal('Netatmo is not configured.');
      expect(netatmoHandler.status).to.equal('not_initialized');
      expect(netatmoHandler.gladys.event.emit.callCount).to.equal(1);
      expect(
        netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
          type: 'netatmo.status',
          payload: { status: 'not_initialized' },
        }),
      ).to.equal(true);
    }
  });

  it('should throw an error if tokens are missing', async () => {
    netatmoHandler.accessToken = null;
    netatmoHandler.refreshToken = null;
    netatmoHandler.configuration.clientId = 'valid_client_id';
    netatmoHandler.configuration.clientSecret = 'valid_client_secret';

    try {
      await netatmoHandler.refreshingTokens();
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
      expect(e.message).to.equal('Netatmo is not connected.');
      expect(netatmoHandler.status).to.equal('disconnected');
      expect(netatmoHandler.gladys.event.emit.callCount).to.equal(1);
      expect(
        netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
          type: 'netatmo.status',
          payload: { status: 'disconnected' },
        }),
      ).to.equal(true);
    }
  });

  it('should successfully refresh tokens', async () => {
    const tokens = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      expire_in: 3600,
    };

    netatmoMock
      .intercept({
        method: 'POST',
        path: '/oauth2/token',
      })
      .reply(200, tokens);

    const result = await netatmoHandler.refreshingTokens();
    expect(result).to.deep.equal({ success: true });
    expect(netatmoHandler.status).to.equal('connected');
    expect(netatmoHandler.configured).to.equal(true);
    expect(netatmoHandler.connected).to.equal(true);
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(2);
    expect(
      netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'processing token' },
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(1).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'connected' },
      }),
    ).to.equal(true);
    sinon.assert.calledWith(
      netatmoHandler.gladys.variable.setValue,
      'NETATMO_ACCESS_TOKEN',
      'new-access-token',
      serviceId,
    );
    sinon.assert.calledWith(
      netatmoHandler.gladys.variable.setValue,
      'NETATMO_REFRESH_TOKEN',
      'new-refresh-token',
      serviceId,
    );
    sinon.assert.calledWith(netatmoHandler.gladys.variable.setValue, 'NETATMO_EXPIRE_IN_TOKEN', 3600, serviceId);
  });

  it('should NOT send an Authorization header on /oauth2/token', async () => {
    let receivedHeaders;
    netatmoMock
      .intercept({
        method: 'POST',
        path: '/oauth2/token',
      })
      .reply(200, (opts) => {
        receivedHeaders = opts.headers;
        return { access_token: 'a', refresh_token: 'b', expire_in: 3600 };
      });

    await netatmoHandler.refreshingTokens();
    const headerKeys = Object.keys(receivedHeaders || {}).map((k) => k.toLowerCase());
    expect(headerKeys).to.not.include('authorization');
  });

  it('should keep tokens and mark RECONNECTING on first fatal HTTP error (400) within grace window', async () => {
    netatmoMock
      .intercept({
        method: 'POST',
        path: '/oauth2/token',
      })
      .reply(400, { error: 'invalid_grant' });

    try {
      await netatmoHandler.refreshingTokens();
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e).to.be.instanceOf(Error);
      expect(e.transient).to.equal(true);
      expect(e.status).to.equal(400);
      expect(netatmoHandler.status).to.equal('reconnecting');
      expect(netatmoHandler.accessToken).to.equal('valid_access_token');
      expect(netatmoHandler.refreshToken).to.equal('valid_refresh_token');
      expect(netatmoHandler.firstFatalAt).to.be.a('number');
      sinon.assert.neverCalledWith(netatmoHandler.gladys.variable.setValue, 'NETATMO_ACCESS_TOKEN', '', serviceId);
    }
  });

  it('should clear tokens after the fatal grace window has elapsed', async () => {
    netatmoMock
      .intercept({
        method: 'POST',
        path: '/oauth2/token',
      })
      .reply(400, { error: 'invalid_grant' });

    netatmoHandler.firstFatalAt = Date.now() - 25 * 60 * 60 * 1000;

    try {
      await netatmoHandler.refreshingTokens();
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e.transient).to.equal(undefined);
      expect(e.message).to.include('HTTP error 400');
      expect(netatmoHandler.status).to.equal('disconnected');
      expect(netatmoHandler.firstFatalAt).to.equal(null);
      sinon.assert.calledWith(netatmoHandler.gladys.variable.setValue, 'NETATMO_ACCESS_TOKEN', '', serviceId);
      sinon.assert.calledWith(netatmoHandler.gladys.variable.setValue, 'NETATMO_REFRESH_TOKEN', '', serviceId);
    }
  });

  it('should keep tokens on first fatal HTTP error (401) within grace window', async () => {
    netatmoMock
      .intercept({
        method: 'POST',
        path: '/oauth2/token',
      })
      .reply(401, { error: 'invalid_client' });

    try {
      await netatmoHandler.refreshingTokens();
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e.transient).to.equal(true);
      expect(netatmoHandler.status).to.equal('reconnecting');
      expect(netatmoHandler.accessToken).to.equal('valid_access_token');
    }
  });

  it('should reset firstFatalAt on successful refresh', async () => {
    netatmoHandler.firstFatalAt = Date.now() - 1000;
    const tokens = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      expire_in: 3600,
    };
    netatmoMock.intercept({ method: 'POST', path: '/oauth2/token' }).reply(200, tokens);

    await netatmoHandler.refreshingTokens();
    expect(netatmoHandler.firstFatalAt).to.equal(null);
  });

  it('should keep tokens and mark RECONNECTING on transient HTTP error (500)', async () => {
    netatmoMock
      .intercept({
        method: 'POST',
        path: '/oauth2/token',
      })
      .reply(500, { error: 'server_error' });

    try {
      await netatmoHandler.refreshingTokens();
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e.transient).to.equal(true);
      expect(e.status).to.equal(500);
      expect(netatmoHandler.status).to.equal('reconnecting');
      expect(netatmoHandler.accessToken).to.equal('valid_access_token');
      expect(netatmoHandler.refreshToken).to.equal('valid_refresh_token');
      sinon.assert.neverCalledWith(netatmoHandler.gladys.variable.setValue, 'NETATMO_ACCESS_TOKEN', '', serviceId);
    }
  });

  it('should keep tokens and mark RECONNECTING on transient HTTP error (429)', async () => {
    netatmoMock
      .intercept({
        method: 'POST',
        path: '/oauth2/token',
      })
      .reply(429, { error: 'too_many_requests' });

    try {
      await netatmoHandler.refreshingTokens();
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e.transient).to.equal(true);
      expect(e.status).to.equal(429);
      expect(netatmoHandler.status).to.equal('reconnecting');
      expect(netatmoHandler.accessToken).to.equal('valid_access_token');
      expect(netatmoHandler.refreshToken).to.equal('valid_refresh_token');
    }
  });

  it('should keep tokens and mark RECONNECTING on network error', async () => {
    netatmoMock
      .intercept({
        method: 'POST',
        path: '/oauth2/token',
      })
      .replyWithError('Network error');

    try {
      await netatmoHandler.refreshingTokens();
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e.transient).to.equal(true);
      expect(e.message).to.include('Transient network error');
      expect(netatmoHandler.status).to.equal('reconnecting');
      expect(netatmoHandler.accessToken).to.equal('valid_access_token');
      expect(netatmoHandler.refreshToken).to.equal('valid_refresh_token');
    }
  });

  it('should clear tokens if response body cannot be parsed as JSON', async () => {
    netatmoMock
      .intercept({
        method: 'POST',
        path: '/oauth2/token',
      })
      .reply(200, 'not-a-json');

    try {
      await netatmoHandler.refreshingTokens();
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
      expect(e.message).to.include('NETATMO: Service is not connected with error');
      expect(netatmoHandler.status).to.equal('disconnected');
      sinon.assert.calledWith(netatmoHandler.gladys.variable.setValue, 'NETATMO_ACCESS_TOKEN', '', serviceId);
    }
  });
});
