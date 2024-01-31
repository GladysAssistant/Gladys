const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');

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
  beforeEach(() => {
    sinon.reset();
    nock.cleanAll();

    netatmoHandler.configuration = {
      clientId: 'valid_client_id',
      clientSecret: 'valid_client_secret',
      scopes: { scopeEnergy: 'scope' },
    };
    netatmoHandler.accessToken = 'valid_access_token';
    netatmoHandler.refreshToken = 'valid_refresh_token';
    netatmoHandler.status = 'not_initialized';
  });

  afterEach(() => {
    sinon.reset();
    nock.cleanAll();
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
    nock('https://api.netatmo.com')
      .post('/oauth2/token')
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

  it('should handle an error during token refresh', async () => {
    nock('https://api.netatmo.com')
      .post('/oauth2/token')
      .reply(400, { error: 'invalid_request' });

    try {
      await netatmoHandler.refreshingTokens();
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
      expect(e.message).to.include('NETATMO: Service is not connected with error');
      expect(netatmoHandler.status).to.equal('disconnected');
      expect(netatmoHandler.gladys.event.emit.callCount).to.equal(3);
      expect(
        netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
          type: 'netatmo.status',
          payload: { status: 'processing token' },
        }),
      ).to.equal(true);
      expect(
        netatmoHandler.gladys.event.emit.getCall(1).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
          type: 'netatmo.error-processing-token',
          payload: { statusType: 'processing token', status: 'refresh_token_fail' },
        }),
      ).to.equal(true);
      expect(
        netatmoHandler.gladys.event.emit.getCall(2).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
          type: 'netatmo.status',
          payload: { status: 'disconnected' },
        }),
      ).to.equal(true);
    }
  });

  it('should handle errors without a response object', async () => {
    netatmoHandler.configuration.clientId = 'test-client-id';
    netatmoHandler.configuration.clientSecret = 'test-client-secret';
    netatmoHandler.configuration.scopes = { scopeEnergy: 'scope' };
    netatmoHandler.refreshToken = 'refresh-token';
    nock('https://api.netatmo.com')
      .post('/oauth2/token')
      .replyWithError('Network error');

    try {
      await netatmoHandler.refreshingTokens();
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
      expect(e.message).to.include('NETATMO: Service is not connected with error');
      expect(e.response).to.equal(undefined);
      expect(netatmoHandler.status).to.equal('disconnected');
      expect(netatmoHandler.gladys.event.emit.callCount).to.equal(3);
    }
  });
});
