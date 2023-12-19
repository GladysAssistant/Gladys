const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');
const EventEmitter = require('events');
const { connect, retrieveTokens } = require('../../../../services/netatmo/lib/netatmo.connect');
const { NetatmoHandlerMock } = require('../netatmo.mock.test');
const netatmoStatus = require('../../../../services/netatmo/lib/netatmo.status');
const { EVENTS } = require('../../../../utils/constants');

describe('Netatmo Connect', () => {
  let eventEmitter;

  beforeEach(() => {
    sinon.reset();
    nock.cleanAll();

    eventEmitter = new EventEmitter();
    NetatmoHandlerMock.gladys = { event: eventEmitter };
    sinon.spy(NetatmoHandlerMock.gladys.event, 'emit');
    NetatmoHandlerMock.saveStatus = sinon.stub().callsFake(netatmoStatus.saveStatus);
    NetatmoHandlerMock.status = 'not_initialized';
  });

  afterEach(() => {
    sinon.reset();
    nock.cleanAll();
  });

  describe('connect', () => {
    it('should throw an error if netatmo is not configured', async () => {
      try {
        await connect(NetatmoHandlerMock);
        expect.fail('should have thrown an error');
      } catch (e) {
        expect(e.message).to.equal('Netatmo is not configured.');
      }
    });

    it('should return auth url and state if netatmo is configured', async () => {
      NetatmoHandlerMock.configuration.clientId = 'test-client-id';
      NetatmoHandlerMock.configuration.clientSecret = 'test-client-secret';
      NetatmoHandlerMock.configuration.scopes = { scopeEnergy: 'scope' };

      const result = await connect(NetatmoHandlerMock);
      expect(result).to.have.property('authUrl');
      expect(result).to.have.property('state');
      expect(NetatmoHandlerMock.configured).to.equal(true);
    });
  });

  describe('retrieveTokens', () => {
    it('should throw an error if state does not match', async () => {
      const body = { codeOAuth: 'test-code', state: 'invalid-state', redirectUri: 'test-redirect-uri' };
      NetatmoHandlerMock.stateGetAccessToken = 'valid-state';

      try {
        await retrieveTokens(NetatmoHandlerMock, body);
        expect.fail('should have thrown an error');
      } catch (e) {
        expect(e.message).to.include('The return does not correspond to the initial request');
        expect(NetatmoHandlerMock.status).to.equal('disconnected');
        expect(NetatmoHandlerMock.configured).to.equal(true);
        expect(NetatmoHandlerMock.connected).to.equal(false);
        expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(1);
        expect(
          NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
            type: 'netatmo.status',
            payload: { status: 'disconnected' },
          }),
        ).to.equal(true);
      }
    });
    it('should retrieve tokens and update netatmo status if state matches', async () => {
      const body = { codeOAuth: 'test-code', state: 'valid-state', redirectUri: 'test-redirect-uri' };
      const tokens = {
        access_token: 'access-token',
        refresh_token: 'refresh-token',
        expire_in: 3600,
      };

      nock('https://api.netatmo.com')
        .persist()
        .post('/oauth2/token')
        .reply(200, tokens);

      const result = await retrieveTokens(NetatmoHandlerMock, body);
      expect(result).to.deep.equal({ success: true });
      expect(NetatmoHandlerMock.status).to.equal('connected');
      expect(NetatmoHandlerMock.configured).to.equal(true);
      expect(NetatmoHandlerMock.connected).to.equal(true);
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(2);
      expect(
        NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
          type: 'netatmo.status',
          payload: { status: 'processing token' },
        }),
      ).to.equal(true);
      expect(
        NetatmoHandlerMock.gladys.event.emit.getCall(1).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
          type: 'netatmo.status',
          payload: { status: 'connected' },
        }),
      ).to.equal(true);
    });
    it('should throw an error if configuration is not complete', async () => {
      const body = { codeOAuth: 'test-code', state: 'valid-state', redirectUri: 'test-redirect-uri' };
      NetatmoHandlerMock.configuration.clientId = null;

      try {
        await retrieveTokens(NetatmoHandlerMock, body);
        expect.fail('should have thrown an error');
      } catch (e) {
        expect(e.message).to.equal('Netatmo is not configured.');
        expect(NetatmoHandlerMock.status).to.equal('not_initialized');
        expect(NetatmoHandlerMock.configured).to.equal(false);
        expect(NetatmoHandlerMock.connected).to.equal(false);
        expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(1);
        expect(
          NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
            type: 'netatmo.status',
            payload: { status: 'not_initialized' },
          }),
        ).to.equal(true);
      }
    });

    it('should throw an error when axios request fails', async () => {
      const body = { codeOAuth: 'test-code', state: 'valid-state', redirectUri: 'test-redirect-uri' };

      NetatmoHandlerMock.configuration.clientId = 'test-client-id';
      NetatmoHandlerMock.configuration.clientSecret = 'test-client-secret';
      NetatmoHandlerMock.configuration.scopes = { scopeEnergy: 'scope' };
      NetatmoHandlerMock.stateGetAccessToken = 'valid-state';

      nock('https://api.netatmo.com')
        .post('/oauth2/token')
        .reply(400, { error: 'invalid_request' });

      try {
        await retrieveTokens(NetatmoHandlerMock, body);
        expect.fail('should have thrown an error');
      } catch (e) {
        expect(e.message).to.include('Service is not connected with error');
        expect(NetatmoHandlerMock.status).to.equal('disconnected');
        expect(NetatmoHandlerMock.configured).to.equal(true);
        expect(NetatmoHandlerMock.connected).to.equal(false);
        expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(3);
        expect(
          NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
            type: 'netatmo.status',
            payload: { status: 'processing token' },
          }),
        ).to.equal(true);
        expect(
          NetatmoHandlerMock.gladys.event.emit.getCall(1).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
            type: 'netatmo.error-processing-token',
            payload: { statusType: 'processing token', status: 'get_access_token_fail' },
          }),
        ).to.equal(true);
        expect(
          NetatmoHandlerMock.gladys.event.emit.getCall(2).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
            type: 'netatmo.status',
            payload: { status: 'disconnected' },
          }),
        ).to.equal(true);
      }
    });
    it('should handle errors without a response object', async () => {
      const body = { codeOAuth: 'test-code', state: 'valid-state', redirectUri: 'test-redirect-uri' };

      NetatmoHandlerMock.configuration.clientId = 'test-client-id';
      NetatmoHandlerMock.configuration.clientSecret = 'test-client-secret';
      NetatmoHandlerMock.configuration.scopes = { scopeEnergy: 'scope' };
      NetatmoHandlerMock.stateGetAccessToken = 'valid-state';

      nock('https://api.netatmo.com')
        .post('/oauth2/token')
        .replyWithError('Network error');

      try {
        await retrieveTokens(NetatmoHandlerMock, body);
        expect.fail('should have thrown an error');
      } catch (e) {
        expect(e.message).to.include('NETATMO: Service is not connected with error');
        expect(e.response).to.equal(undefined);
        expect(NetatmoHandlerMock.status).to.equal('disconnected');
        expect(NetatmoHandlerMock.configured).to.equal(true);
        expect(NetatmoHandlerMock.connected).to.equal(false);
      }
    });
  });
});
