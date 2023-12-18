const { expect } = require('chai');
const sinon = require('sinon');
const EventEmitter = require('events');
const { getStatus, saveStatus } = require('../../../../services/netatmo/lib/netatmo.status');
const { NetatmoHandlerMock } = require('../netatmo.mock.test');
const { EVENTS } = require('../../../../utils/constants');
const { STATUS } = require('../../../../services/netatmo/lib/utils/netatmo.constants');

describe.only('Netatmo Discover devices', () => {
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
    let fakeIntervalId;
    beforeEach(() => {
      fakeIntervalId = setTimeout(() => { }, 1000);
      sinon.stub(global, 'setInterval').returns(fakeIntervalId);
      sinon.stub(global, 'clearInterval');
    });

    afterEach(() => {
      sinon.restore();
    });

    it('should update the status to NOT_INITIALIZED and emit the event', () => {
      NetatmoHandlerMock.pollRefreshValues = fakeIntervalId;

      saveStatus(NetatmoHandlerMock, { statusType: STATUS.NOT_INITIALIZED, message: null });

      expect(NetatmoHandlerMock.status).to.equal('not_initialized');
      expect(NetatmoHandlerMock.configured).to.be.false;
      expect(NetatmoHandlerMock.connected).to.be.false;
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(1);
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'not_initialized' },
      });
      // @ts-ignore
      expect(global.clearInterval.calledWith(fakeIntervalId)).to.be.true;
    });
    it('should update the status to CONNECTING and emit the event', () => {
      saveStatus(NetatmoHandlerMock, { statusType: STATUS.CONNECTING, message: null });

      expect(NetatmoHandlerMock.status).to.equal('connecting');
      expect(NetatmoHandlerMock.configured).to.be.true;
      expect(NetatmoHandlerMock.connected).to.be.false;
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(1);
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'connecting' },
      });
    });
    it('should update the status to PROCESSING_TOKEN and emit the event', () => {
      saveStatus(NetatmoHandlerMock, { statusType: STATUS.PROCESSING_TOKEN, message: null });

      expect(NetatmoHandlerMock.status).to.equal('processing token');
      expect(NetatmoHandlerMock.configured).to.be.true;
      expect(NetatmoHandlerMock.connected).to.be.false;
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(1);
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'processing token' },
      });
    });
    it('should update the status to CONNECTED and emit the event', () => {
      saveStatus(NetatmoHandlerMock, { statusType: STATUS.CONNECTED, message: null });

      expect(NetatmoHandlerMock.status).to.equal('connected');
      expect(NetatmoHandlerMock.configured).to.be.true;
      expect(NetatmoHandlerMock.connected).to.be.true;
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(1);
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'connected' },
      });
    });
    it('should update the status to DISCONNECTING and emit the event', () => {
      saveStatus(NetatmoHandlerMock, { statusType: STATUS.DISCONNECTING, message: null });

      expect(NetatmoHandlerMock.status).to.equal('disconnecting');
      expect(NetatmoHandlerMock.configured).to.be.true;
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(1);
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'disconnecting' },
      });
    });
    it('should update the status to DISCONNECTED and emit the event', () => {
      NetatmoHandlerMock.pollRefreshValues = fakeIntervalId;
      saveStatus(NetatmoHandlerMock, { statusType: STATUS.DISCONNECTED, message: null });

      expect(NetatmoHandlerMock.status).to.equal('disconnected');
      expect(NetatmoHandlerMock.configured).to.be.true;
      expect(NetatmoHandlerMock.connected).to.be.false;
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(1);
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'disconnected' },
      });
      // @ts-ignore
      expect(global.clearInterval.calledWith(fakeIntervalId)).to.be.true;
    });
    it('should update the status to DISCOVERING_DEVICES and emit the event', () => {
      saveStatus(NetatmoHandlerMock, { statusType: STATUS.DISCOVERING_DEVICES, message: null });

      expect(NetatmoHandlerMock.status).to.equal('discovering');
      expect(NetatmoHandlerMock.configured).to.be.true;
      expect(NetatmoHandlerMock.connected).to.be.true;
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(1);
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'discovering' },
      });
    });

    it('should update the status to ERROR CONNECTING and emit the event', () => {
      saveStatus(NetatmoHandlerMock, {
        statusType: 'error connecting',
        message: 'error_connecting',
      });

      expect(NetatmoHandlerMock.status).to.equal('disconnected');
      expect(NetatmoHandlerMock.connected).to.be.false;
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(2);
      expect(NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.error-connecting',
        payload: { statusType: 'connecting', status: 'error_connecting' },
      })).to.be.true;
      expect(NetatmoHandlerMock.gladys.event.emit.getCall(1).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'disconnected' },
      })).to.be.true;
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
      expect(NetatmoHandlerMock.connected).to.be.false;
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(2);
      expect(NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.error-processing-token',
        payload: { statusType: 'processing token', status: 'get_access_token_fail' },
      })).to.be.true;
      expect(NetatmoHandlerMock.gladys.event.emit.getCall(1).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'disconnected' },
      })).to.be.true;
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
      expect(NetatmoHandlerMock.configured).to.be.true;
      expect(NetatmoHandlerMock.connected).to.be.false;
      expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(2);
      expect(NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.error-connected',
        payload: { statusType: 'connected', status: 'error_connected' },
      })).to.be.true;
      expect(NetatmoHandlerMock.gladys.event.emit.getCall(1).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'disconnected' },
      })).to.be.true;
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
      expect(NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.error-connected',
        payload: { statusType: 'connected', status: 'error_set_devices_values' },
      })).to.be.true;
      expect(NetatmoHandlerMock.gladys.event.emit.getCall(1).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'connected' },
      })).to.be.true;
      sinon.assert.calledWith(NetatmoHandlerMock.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'connected' },
      });
    });

    it('should handle unknown status types gracefully', () => {
      const result = saveStatus(NetatmoHandlerMock, { statusType: 'unknown_status', message: null });

      expect(result).to.be.true;
    });

    it('should return false on error', () => {
      NetatmoHandlerMock.gladys.event.emit = sinon.stub().throws(new Error('Emit failed'));

      const result = saveStatus(NetatmoHandlerMock, { statusType: STATUS.CONNECTED, message: null });
      expect(result).to.be.false;
    });
  });
});
