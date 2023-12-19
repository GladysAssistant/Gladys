const { expect } = require('chai');
const sinon = require('sinon');
const EventEmitter = require('events');
const { pollRefreshingValues, pollRefreshingToken } = require('../../../../services/netatmo/lib/netatmo.poll');
const { NetatmoHandlerMock } = require('../netatmo.mock.test');
const netatmoStatus = require('../../../../services/netatmo/lib/netatmo.status');
const netatmoSetTokens = require('../../../../services/netatmo/lib/netatmo.setTokens');
const { EVENTS } = require('../../../../utils/constants');
const devicesMock = require('../netatmo.loadDevices.mock.test.json');
const devicesExistsMock = require('../netatmo.discoverDevices.mock.test.json');

describe('Netatmo Poll', () => {
  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  describe('pollRefreshingValues', () => {
    let eventEmitter;
    beforeEach(() => {
      sinon.restore();
      sinon.stub(global, 'setInterval');

      eventEmitter = new EventEmitter();
      NetatmoHandlerMock.status = 'not_initialized';
      NetatmoHandlerMock.gladys = {
        stateManager: {
          get: sinon.stub().resolves(),
        },
        event: eventEmitter,
      };
      sinon.spy(NetatmoHandlerMock.gladys.event, 'emit');

      NetatmoHandlerMock.saveStatus = sinon.stub().callsFake(netatmoStatus.saveStatus);
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should refresh device values periodically', async () => {
      NetatmoHandlerMock.status = 'connected';
      NetatmoHandlerMock.loadDevices = sinon.stub().resolves(devicesMock);

      NetatmoHandlerMock.gladys.stateManager.get = sinon.stub().returns(devicesExistsMock);
      await pollRefreshingValues(NetatmoHandlerMock);
      sinon.assert.called(NetatmoHandlerMock.loadDevices);
      expect(NetatmoHandlerMock.configured).to.equal(true);
      expect(NetatmoHandlerMock.connected).to.equal(true);
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(2);
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'get devices values' },
      });
    });

    it('should handle an error during device loading', async () => {
      NetatmoHandlerMock.loadDevices = sinon.stub().rejects(new Error('Failed to load'));
      await pollRefreshingValues(NetatmoHandlerMock);
      sinon.assert.called(NetatmoHandlerMock.loadDevices);
      expect(NetatmoHandlerMock.configured).to.equal(true);
      expect(NetatmoHandlerMock.connected).to.equal(true);
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(4);
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'get devices values' },
      });
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.error-connected',
        payload: { status: 'get_devices_value_fail', statusType: 'connected' },
      });
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'get devices values' },
      });
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'connected' },
      });
    });
  });

  describe('pollRefreshingToken', () => {
    let eventEmitter;
    beforeEach(() => {
      sinon.restore();
      sinon.stub(global, 'setInterval');

      eventEmitter = new EventEmitter();
      NetatmoHandlerMock.status = 'not_initialized';
      NetatmoHandlerMock.gladys = { event: eventEmitter };
      sinon.spy(NetatmoHandlerMock.gladys.event, 'emit');
      NetatmoHandlerMock.refreshingTokens = sinon.stub().resolves({ success: true });
      NetatmoHandlerMock.setTokens = sinon.stub().callsFake(netatmoSetTokens.setTokens);
      NetatmoHandlerMock.expireInToken = 3600;
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should handle failed token refresh', async () => {
      NetatmoHandlerMock.refreshingTokens.resolves({ success: false });

      await pollRefreshingToken(NetatmoHandlerMock);
      expect(NetatmoHandlerMock.configured).to.equal(true);
      expect(NetatmoHandlerMock.connected).to.equal(false);
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(3);
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'processing token' },
      });
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.error-processing-token',
        payload: { status: null, statusType: 'processing token' },
      });
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'disconnected' },
      });
    });

    it('should refresh tokens periodically', async () => {
      await pollRefreshingToken(NetatmoHandlerMock);
      sinon.assert.called(NetatmoHandlerMock.refreshingTokens);
      expect(NetatmoHandlerMock.configured).to.equal(true);
      expect(NetatmoHandlerMock.connected).to.equal(true);
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(2);
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'processing token' },
      });
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'connected' },
      });
    });

    it('should new expiration token different expiration token store', async () => {
      await pollRefreshingToken(NetatmoHandlerMock);
      sinon.assert.called(NetatmoHandlerMock.refreshingTokens);
      NetatmoHandlerMock.refreshingTokens.reset();
    });
    it('should restart polling when expireInToken changes', async () => {
      NetatmoHandlerMock.expireInToken = 3600;
      NetatmoHandlerMock.refreshingTokens = sinon.stub().callsFake(async () => {
        NetatmoHandlerMock.expireInToken = 7200;
        return { success: true };
      });

      await pollRefreshingToken(NetatmoHandlerMock);

      sinon.assert.calledTwice(NetatmoHandlerMock.pollRefreshingToken);
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(2);
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'processing token' },
      });
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'connected' },
      });
    });
  });
});
