const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');

const { fake } = sinon;

const { EVENTS } = require('../../../../utils/constants');
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
netatmoHandler.pollRefreshingToken = fake.resolves(null);
netatmoHandler.pollRefreshingValues = fake.resolves(null);

describe('Netatmo retrieveTokens', () => {
  let body;
  beforeEach(() => {
    sinon.reset();
    nock.cleanAll();

    body = { codeOAuth: 'test-code', state: 'valid-state', redirectUri: 'test-redirect-uri' };
    netatmoHandler.configuration.clientId = 'clientId-fake';
    netatmoHandler.configuration.clientSecret = 'clientSecret-fake';
    netatmoHandler.stateGetAccessToken = 'valid-state';
    netatmoHandler.status = 'not_initialized';
  });

  afterEach(() => {
    sinon.reset();
    nock.cleanAll();
  });

  it('should throw an error if configuration is not complete', async () => {
    netatmoHandler.configuration.clientId = null;

    try {
      await netatmoHandler.retrieveTokens(body);
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e.message).to.equal('Netatmo is not configured.');
      expect(netatmoHandler.status).to.equal('not_initialized');
      expect(netatmoHandler.configured).to.equal(false);
      expect(netatmoHandler.connected).to.equal(false);
      expect(netatmoHandler.gladys.event.emit.callCount).to.equal(1);
      expect(
        netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
          type: 'netatmo.status',
          payload: { status: 'not_initialized' },
        }),
      ).to.equal(true);
    }
  });

  it('should throw an error if state does not match', async () => {
    body = { codeOAuth: 'test-code', state: 'invalid-state', redirectUri: 'test-redirect-uri' };

    try {
      await netatmoHandler.retrieveTokens(body);
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e.message).to.include(
        'Netatmo did not connect correctly. The return does not correspond to the initial request',
      );
      expect(netatmoHandler.status).to.equal('disconnected');
      expect(netatmoHandler.configured).to.equal(true);
      expect(netatmoHandler.connected).to.equal(false);
      expect(netatmoHandler.gladys.event.emit.callCount).to.equal(1);
      expect(
        netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
          type: 'netatmo.status',
          payload: { status: 'disconnected' },
        }),
      ).to.equal(true);
    }
  });

  it('should retrieve tokens and update netatmo status if state matches', async () => {
    const tokens = {
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expire_in: 3600,
    };
    nock('https://api.netatmo.com')
      .persist()
      .post('/oauth2/token')
      .reply(200, tokens);

    const result = await netatmoHandler.retrieveTokens(body);

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
    sinon.assert.notCalled(netatmoHandler.pollRefreshingValues);
    sinon.assert.calledOnce(netatmoHandler.pollRefreshingToken);
  });

  it('should retrieve tokens and launch pollRefreshingValues', async () => {
    const tokens = {
      access_token: 'access-token',
      refresh_token: 'refresh-token',
      expire_in: 3600,
    };
    netatmoHandler.configuration.energyApi = true;

    nock('https://api.netatmo.com')
      .persist()
      .post('/oauth2/token')
      .reply(200, tokens);

    const result = await netatmoHandler.retrieveTokens(body);

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
    sinon.assert.calledOnce(netatmoHandler.pollRefreshingValues);
    sinon.assert.calledOnce(netatmoHandler.pollRefreshingToken);
  });

  it('should throw an error when axios request fails', async () => {
    const bodyFake = { codeOAuth: 'test-code', state: 'valid-state', redirectUri: 'test-redirect-uri' };
    netatmoHandler.configuration.clientId = 'test-client-id';
    netatmoHandler.configuration.clientSecret = 'test-client-secret';
    netatmoHandler.configuration.scopes = { scopeEnergy: 'scope' };
    netatmoHandler.stateGetAccessToken = 'valid-state';
    nock('https://api.netatmo.com')
      .post('/oauth2/token')
      .reply(400, { error: 'invalid_request' });

    try {
      await netatmoHandler.retrieveTokens(bodyFake);
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e.message).to.include('Service is not connected with error');
      expect(netatmoHandler.status).to.equal('disconnected');
      expect(netatmoHandler.configured).to.equal(true);
      expect(netatmoHandler.connected).to.equal(false);
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
          payload: { statusType: 'processing token', status: 'get_access_token_fail' },
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
    const bodyFake = { codeOAuth: 'test-code', state: 'valid-state', redirectUri: 'test-redirect-uri' };
    netatmoHandler.configuration.clientId = 'test-client-id';
    netatmoHandler.configuration.clientSecret = 'test-client-secret';
    netatmoHandler.configuration.scopes = { scopeEnergy: 'scope' };
    netatmoHandler.stateGetAccessToken = 'valid-state';
    nock('https://api.netatmo.com')
      .post('/oauth2/token')
      .replyWithError('Network error');

    try {
      await netatmoHandler.retrieveTokens(bodyFake);
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e.message).to.include('NETATMO: Service is not connected with error');
      expect(e.response).to.equal(undefined);
      expect(netatmoHandler.status).to.equal('disconnected');
      expect(netatmoHandler.configured).to.equal(true);
      expect(netatmoHandler.connected).to.equal(false);
    }
  });
});
