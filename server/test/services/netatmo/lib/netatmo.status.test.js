const { expect } = require('chai');
const sinon = require('sinon');
const EventEmitter = require('events');

const { assert } = sinon;
const { getStatus, saveStatus } = require('../../../../services/netatmo/lib/netatmo.status');
const { NetatmoHandlerMock } = require('../netatmo.mock.test');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { STATUS } = require('../../../../services/netatmo/lib/utils/netatmo.constants');

describe('Netatmo Discover devices', () => {
  let eventEmitter;

  beforeEach(() => {
    sinon.reset();

    eventEmitter = new EventEmitter();
    NetatmoHandlerMock.status = 'not_initialized';
    NetatmoHandlerMock.gladys = {
      event: eventEmitter,
    };
    sinon.spy(NetatmoHandlerMock.gladys.event, 'emit');
  });

  afterEach(() => {
    sinon.reset();
  });

  describe('getStatus', () => {
    it('should return the current status of Netatmo handler', () => {
      NetatmoHandlerMock.configured = true;
      NetatmoHandlerMock.connected = false;
      NetatmoHandlerMock.status = STATUS.CONNECTED;

      const status = getStatus.call(NetatmoHandlerMock);

      expect(status).to.deep.equal({
        configured: true,
        connected: false,
        status: 'connected',
      });
    });
  });

  describe('saveStatus', () => {
    let clock;

    beforeEach(() => {
      sinon.reset();
      clock = sinon.useFakeTimers();
    });

    afterEach(() => {
      clock.restore();
      sinon.reset();
    });

    it('should update the status to NOT_INITIALIZED and emit the event', () => {
      sinon.spy(clock, 'clearInterval');
      const intervalPollRefreshTokenSpy = sinon.spy();
      const intervalPollRefreshValuesSpy = sinon.spy();
      NetatmoHandlerMock.pollRefreshToken = setInterval(intervalPollRefreshTokenSpy, 3600);
      NetatmoHandlerMock.pollRefreshValues = setInterval(intervalPollRefreshValuesSpy, 120);

      saveStatus(NetatmoHandlerMock, { statusType: STATUS.NOT_INITIALIZED, message: null });

      expect(NetatmoHandlerMock.status).to.equal('not_initialized');
      expect(NetatmoHandlerMock.configured).to.equal(false);
      expect(NetatmoHandlerMock.connected).to.equal(false);
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(1);
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'not_initialized' },
      });
      clock.tick(3600 * 1000 * 2);
      assert.calledTwice(clock.clearInterval);
      expect(intervalPollRefreshTokenSpy.notCalled).to.equal(true);
      expect(intervalPollRefreshValuesSpy.notCalled).to.equal(true);
    });
    it('should update the status to CONNECTING and emit the event', () => {
      saveStatus(NetatmoHandlerMock, { statusType: STATUS.CONNECTING, message: null });

      expect(NetatmoHandlerMock.status).to.equal('connecting');
      expect(NetatmoHandlerMock.configured).to.equal(true);
      expect(NetatmoHandlerMock.connected).to.equal(false);
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(1);
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'connecting' },
      });
    });
    it('should update the status to PROCESSING_TOKEN and emit the event', () => {
      saveStatus(NetatmoHandlerMock, { statusType: STATUS.PROCESSING_TOKEN, message: null });

      expect(NetatmoHandlerMock.status).to.equal('processing token');
      expect(NetatmoHandlerMock.configured).to.equal(true);
      expect(NetatmoHandlerMock.connected).to.equal(false);
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(1);
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'processing token' },
      });
    });
    it('should update the status to CONNECTED and emit the event', () => {
      saveStatus(NetatmoHandlerMock, { statusType: STATUS.CONNECTED, message: null });

      expect(NetatmoHandlerMock.status).to.equal('connected');
      expect(NetatmoHandlerMock.configured).to.equal(true);
      expect(NetatmoHandlerMock.connected).to.equal(true);
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(1);
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'connected' },
      });
    });
    it('should update the status to DISCONNECTING and emit the event', () => {
      saveStatus(NetatmoHandlerMock, { statusType: STATUS.DISCONNECTING, message: null });

      expect(NetatmoHandlerMock.status).to.equal('disconnecting');
      expect(NetatmoHandlerMock.configured).to.equal(true);
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(1);
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'disconnecting' },
      });
    });
    it('should update the status to DISCONNECTED and emit the event', () => {
      sinon.spy(clock, 'clearInterval');
      const intervalPollRefreshTokenSpy = sinon.spy();
      const intervalPollRefreshValuesSpy = sinon.spy();
      NetatmoHandlerMock.pollRefreshToken = setInterval(intervalPollRefreshTokenSpy, 3600);
      NetatmoHandlerMock.pollRefreshValues = setInterval(intervalPollRefreshValuesSpy, 120);

      saveStatus(NetatmoHandlerMock, { statusType: STATUS.DISCONNECTED, message: null });

      expect(NetatmoHandlerMock.status).to.equal('disconnected');
      expect(NetatmoHandlerMock.configured).to.equal(true);
      expect(NetatmoHandlerMock.connected).to.equal(false);
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(1);
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'disconnected' },
      });
      clock.tick(3600 * 1000 * 2);
      assert.calledTwice(clock.clearInterval);
      expect(intervalPollRefreshTokenSpy.notCalled).to.equal(true);
      expect(intervalPollRefreshValuesSpy.notCalled).to.equal(true);
    });
    it('should update the status to DISCOVERING_DEVICES and emit the event', () => {
      saveStatus(NetatmoHandlerMock, { statusType: STATUS.DISCOVERING_DEVICES, message: null });

      expect(NetatmoHandlerMock.status).to.equal('discovering');
      expect(NetatmoHandlerMock.configured).to.equal(true);
      expect(NetatmoHandlerMock.connected).to.equal(true);
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(1);
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'discovering' },
      });
    });
    it('should update the status to GET_DEVICES_VALUES and emit the event', () => {
      saveStatus(NetatmoHandlerMock, { statusType: STATUS.GET_DEVICES_VALUES, message: null });

      expect(NetatmoHandlerMock.status).to.equal('get devices values');
      expect(NetatmoHandlerMock.configured).to.equal(true);
      expect(NetatmoHandlerMock.connected).to.equal(true);
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(1);
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'get devices values' },
      });
    });

    it('should update the status to ERROR CONNECTING and emit the event', () => {
      saveStatus(NetatmoHandlerMock, {
        statusType: 'error connecting',
        message: 'error_connecting',
      });

      expect(NetatmoHandlerMock.status).to.equal('disconnected');
      expect(NetatmoHandlerMock.connected).to.equal(false);
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(2);
      expect(
        NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.CONNECTING,
          payload: { statusType: 'connecting', status: 'error_connecting' },
        }),
      ).to.equal(true);
      expect(
        NetatmoHandlerMock.gladys.event.emit.getCall(1).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
          payload: { status: 'disconnected' },
        }),
      ).to.equal(true);
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'disconnected' },
      });
    });

    it('should update the status to ERROR PROCESSING_TOKEN and emit the event', () => {
      saveStatus(NetatmoHandlerMock, {
        statusType: 'error processing token',
        message: 'get_access_token_fail',
      });

      expect(NetatmoHandlerMock.status).to.equal('disconnected');
      expect(NetatmoHandlerMock.connected).to.equal(false);
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(2);
      expect(
        NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.PROCESSING_TOKEN,
          payload: { statusType: 'processing token', status: 'get_access_token_fail' },
        }),
      ).to.equal(true);
      expect(
        NetatmoHandlerMock.gladys.event.emit.getCall(1).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
          payload: { status: 'disconnected' },
        }),
      ).to.equal(true);
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'disconnected' },
      });
    });

    it('should update the status to ERROR CONNECTED and emit the event', () => {
      saveStatus(NetatmoHandlerMock, {
        statusType: 'error connected',
        message: 'error_connected',
      });

      expect(NetatmoHandlerMock.status).to.equal('disconnected');
      expect(NetatmoHandlerMock.configured).to.equal(true);
      expect(NetatmoHandlerMock.connected).to.equal(false);
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(2);
      expect(
        NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
          type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.CONNECTED,
          payload: { statusType: 'connected', status: 'error_connected' },
        }),
      ).to.equal(true);
      expect(
        NetatmoHandlerMock.gladys.event.emit.getCall(1).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
          type: 'netatmo.status',
          payload: { status: 'disconnected' },
        }),
      ).to.equal(true);
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'disconnected' },
      });
    });

    it('should update the status to ERROR SET_DEVICES_VALUES and emit the event', () => {
      NetatmoHandlerMock.status = 'connected';
      saveStatus(NetatmoHandlerMock, {
        statusType: 'error set devices values',
        message: 'error_set_devices_values',
      });

      expect(NetatmoHandlerMock.status).to.equal('connected');
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(2);
      expect(
        NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
          type: 'netatmo.error-connected',
          payload: { statusType: 'connected', status: 'error_set_devices_values' },
        }),
      ).to.equal(true);
      expect(
        NetatmoHandlerMock.gladys.event.emit.getCall(1).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
          type: 'netatmo.status',
          payload: { status: 'connected' },
        }),
      ).to.equal(true);
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'connected' },
      });
    });

    it('should handle unknown status types gracefully', () => {
      const result = saveStatus(NetatmoHandlerMock, { statusType: 'unknown_status', message: null });

      expect(result).to.equal(true);
    });

    it('should return false on error', () => {
      NetatmoHandlerMock.gladys.event.emit = sinon.stub().throws(new Error('Emit failed'));

      const result = saveStatus(NetatmoHandlerMock, { statusType: STATUS.CONNECTED, message: null });
      expect(result).to.equal(false);
    });
  });
});
