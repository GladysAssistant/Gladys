const { expect } = require('chai');
const sinon = require('sinon');
const nock = require('nock');
const EventEmitter = require('events');
const { refreshingTokens } = require('../../../../services/netatmo/lib/netatmo.refreshingTokens');
const { NetatmoHandlerMock } = require('../netatmo.mock.test');
const netatmoStatus = require('../../../../services/netatmo/lib/netatmo.status');
const netatmoSetTokens = require('../../../../services/netatmo/lib/netatmo.setTokens');
const { EVENTS } = require('../../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

describe.only('Netatmo Refreshing Tokens', () => {
  let eventEmitter;
  const serviceId = 'serviceId';
  beforeEach(() => {
    sinon.reset();
    nock.cleanAll();

    eventEmitter = new EventEmitter();
    NetatmoHandlerMock.saveStatus = sinon.stub().callsFake(netatmoStatus.saveStatus);
    NetatmoHandlerMock.setTokens = sinon.stub().callsFake(netatmoSetTokens.setTokens);
    NetatmoHandlerMock.status = 'not_initialized';
    NetatmoHandlerMock.gladys = {
      event: eventEmitter,
      variable: {
        setValue: sinon.stub().resolves()
      }
    };
    sinon.spy(NetatmoHandlerMock.gladys.event, 'emit');
  });

  afterEach(() => {
    sinon.reset();
    nock.cleanAll();
  });

  it('should throw an error if tokens or configuration are missing', async () => {
    NetatmoHandlerMock.accessToken = null;
    NetatmoHandlerMock.refreshToken = null;
    NetatmoHandlerMock.configuration.clientId = null;
    NetatmoHandlerMock.configuration.clientSecret = null;

    try {
      await refreshingTokens.call(NetatmoHandlerMock);
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
      expect(e.message).to.equal('Netatmo is not connected.');
      expect(NetatmoHandlerMock.status).to.equal('not_initialized');
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(1);
      expect(NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'not_initialized' },
      })).to.be.true;
    }
  });

  it('should successfully refresh tokens', async () => {
    NetatmoHandlerMock.configuration.clientId = 'test-client-id';
    NetatmoHandlerMock.configuration.clientSecret = 'test-client-secret';
    NetatmoHandlerMock.configuration.scopes = { scopeEnergy: 'scope' };
    NetatmoHandlerMock.refreshToken = 'refresh-token';
    const tokens = {
      access_token: 'new-access-token',
      refresh_token: 'new-refresh-token',
      expire_in: 3600,
    };
    nock('https://api.netatmo.com')
      .post('/oauth2/token')
      .reply(200, tokens);

    const result = await refreshingTokens.call(NetatmoHandlerMock);
    expect(result).to.deep.equal({ success: true });
    expect(NetatmoHandlerMock.status).to.equal('connected');
    expect(NetatmoHandlerMock.configured).to.be.true;
    expect(NetatmoHandlerMock.connected).to.be.true;
    expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(2);
    expect(NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
      type: 'netatmo.status',
      payload: { status: 'processing token' },
    })).to.be.true;
    expect(NetatmoHandlerMock.gladys.event.emit.getCall(1).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
      type: 'netatmo.status',
      payload: { status: 'connected' },
    })).to.be.true;
    sinon.assert.calledWith(NetatmoHandlerMock.gladys.variable.setValue, 'NETATMO_ACCESS_TOKEN', 'new-access-token', serviceId);
    sinon.assert.calledWith(NetatmoHandlerMock.gladys.variable.setValue, 'NETATMO_REFRESH_TOKEN', 'new-refresh-token', serviceId);
    sinon.assert.calledWith(NetatmoHandlerMock.gladys.variable.setValue, 'NETATMO_EXPIRE_IN_TOKEN', 3600, serviceId);
    expect(NetatmoHandlerMock.status).to.equal('connected');
  });

  it('should handle an error during token refresh', async () => {
    nock('https://api.netatmo.com')
      .post('/oauth2/token')
      .reply(400, { error: 'invalid_request' });

    try {
      await refreshingTokens.call(NetatmoHandlerMock);
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
      expect(e.message).to.include('NETATMO: Service is not connected with error');
      expect(NetatmoHandlerMock.status).to.equal('disconnected');
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(3);
      expect(NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'processing token' },
      })).to.be.true;
      expect(NetatmoHandlerMock.gladys.event.emit.getCall(1).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.error-processing-token',
        payload: { statusType: 'processing token', status: 'refresh_token_fail' },
      })).to.be.true;
      expect(NetatmoHandlerMock.gladys.event.emit.getCall(2).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'disconnected' },
      })).to.be.true;
    }
  });

  it('should handle errors without a response object', async () => {
    NetatmoHandlerMock.configuration.clientId = 'test-client-id';
    NetatmoHandlerMock.configuration.clientSecret = 'test-client-secret';
    NetatmoHandlerMock.configuration.scopes = { scopeEnergy: 'scope' };
    NetatmoHandlerMock.refreshToken = 'refresh-token';

    nock('https://api.netatmo.com')
      .post('/oauth2/token')
      .replyWithError('Network error');

    try {
      await refreshingTokens.call(NetatmoHandlerMock);
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
      expect(e.message).to.include('NETATMO: Service is not connected with error');
      expect(e.response).to.be.undefined;
      expect(NetatmoHandlerMock.status).to.equal('disconnected');
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(3);
    }
  });


});
