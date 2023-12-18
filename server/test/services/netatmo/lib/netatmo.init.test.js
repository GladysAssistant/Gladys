const { expect } = require('chai');
const sinon = require('sinon');
const EventEmitter = require('events');
const { init } = require('../../../../services/netatmo/lib/netatmo.init');
const { NetatmoHandlerMock } = require('../netatmo.mock.test');
const netatmoRefreshingTokens = require('../../../../services/netatmo/lib/netatmo.refreshingTokens');
const netatmoStatus = require('../../../../services/netatmo/lib/netatmo.status');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');
const { EVENTS } = require('../../../../utils/constants');

describe.only('Netatmo Init', () => {
  let eventEmitter;
  beforeEach(() => {
    sinon.restore();
    eventEmitter = new EventEmitter();
    NetatmoHandlerMock.gladys = { event: eventEmitter };
    sinon.spy(NetatmoHandlerMock.gladys.event, 'emit');

    NetatmoHandlerMock.saveStatus = sinon.stub().callsFake(netatmoStatus.saveStatus);
    NetatmoHandlerMock.status = 'not_initialized';
    NetatmoHandlerMock.refreshingTokens = sinon.stub().callsFake(netatmoRefreshingTokens.refreshingTokens);
  });
  afterEach(() => {
    sinon.restore();
  });

  it('should throw an error if not configured', async () => {
    NetatmoHandlerMock.configuration.clientId = null;
    NetatmoHandlerMock.configuration.clientSecret = null;

    try {
      await init(NetatmoHandlerMock);
      expect.fail('should have thrown an error');
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
      expect(e.message).to.equal('Netatmo is not configured.');
    }
    expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(1);
    expect(NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
      type: 'netatmo.status',
      payload: { status: 'not_initialized' },
    })).to.be.true;
  });

  it('should handle valid access and refresh tokens', async () => {
    NetatmoHandlerMock.configuration.clientId = 'valid_client_id';
    NetatmoHandlerMock.configuration.clientSecret = 'valid_client_secret';
    NetatmoHandlerMock.accessToken = 'valid_access_token';
    NetatmoHandlerMock.refreshToken = 'valid_refresh_token';
    NetatmoHandlerMock.refreshingTokens.resolves({ success: true });

    await init(NetatmoHandlerMock);

    expect(NetatmoHandlerMock.refreshingTokens.called).to.be.true;
    expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(1);
    expect(NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
      type: 'netatmo.status',
      payload: { status: 'connected' },
    })).to.be.true;
  });

  it('should handle failed token refresh', async () => {
    NetatmoHandlerMock.refreshingTokens.resolves({ success: false });

    await init(NetatmoHandlerMock);

    expect(NetatmoHandlerMock.setTokens.calledWith(sinon.match.any, sinon.match.has('accessToken', ''))).to.be.true;
    expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(2);
    expect(NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
      type: 'netatmo.error-processing-token',
      payload: { statusType: 'processing token', status: null },
    })).to.be.true;
    expect(NetatmoHandlerMock.gladys.event.emit.getCall(1).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
      type: 'netatmo.status',
      payload: { status: 'disconnected' },
    })).to.be.true;
  });

  it('should handle missing access or refresh tokens', async () => {
    NetatmoHandlerMock.accessToken = null;
    NetatmoHandlerMock.refreshToken = null;

    await init(NetatmoHandlerMock);

    expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(1);
    expect(NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
      type: 'netatmo.status',
      payload: { status: 'disconnected' },
    })).to.be.true;
  });
});
