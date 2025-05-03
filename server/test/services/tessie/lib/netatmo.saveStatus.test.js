const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { STATUS } = require('../../../../services/netatmo/lib/utils/netatmo.constants');
const NetatmoHandler = require('../../../../services/netatmo/lib/index');

const gladys = {
  event: {
    emit: fake.resolves(null),
  },
};
const serviceId = 'serviceId';

const netatmoHandler = new NetatmoHandler(gladys, serviceId);

describe('Netatmo saveStatus', () => {
  let clock;

  beforeEach(() => {
    sinon.reset();
    clock = sinon.useFakeTimers();

    netatmoHandler.status = 'not_initialized';
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('should update the status to NOT_INITIALIZED and emit the event', () => {
    sinon.spy(clock, 'clearInterval');
    const intervalPollRefreshTokenSpy = sinon.spy();
    const intervalPollRefreshValuesSpy = sinon.spy();
    netatmoHandler.pollRefreshToken = setInterval(intervalPollRefreshTokenSpy, 3600);
    netatmoHandler.pollRefreshValues = setInterval(intervalPollRefreshValuesSpy, 120);

    netatmoHandler.saveStatus({ statusType: STATUS.NOT_INITIALIZED, message: null });

    expect(netatmoHandler.status).to.equal('not_initialized');
    expect(netatmoHandler.configured).to.equal(false);
    expect(netatmoHandler.connected).to.equal(false);
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(1);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: 'netatmo.status',
      payload: { status: 'not_initialized' },
    });
    clock.tick(3600 * 1000 * 2);
    assert.calledTwice(clock.clearInterval);
    expect(intervalPollRefreshTokenSpy.notCalled).to.equal(true);
    expect(intervalPollRefreshValuesSpy.notCalled).to.equal(true);
  });
  it('should update the status to CONNECTING and emit the event', () => {
    netatmoHandler.saveStatus({ statusType: STATUS.CONNECTING, message: null });

    expect(netatmoHandler.status).to.equal('connecting');
    expect(netatmoHandler.configured).to.equal(true);
    expect(netatmoHandler.connected).to.equal(false);
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(1);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: 'netatmo.status',
      payload: { status: 'connecting' },
    });
  });
  it('should update the status to PROCESSING_TOKEN and emit the event', () => {
    netatmoHandler.saveStatus({ statusType: STATUS.PROCESSING_TOKEN, message: null });

    expect(netatmoHandler.status).to.equal('processing token');
    expect(netatmoHandler.configured).to.equal(true);
    expect(netatmoHandler.connected).to.equal(false);
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(1);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: 'netatmo.status',
      payload: { status: 'processing token' },
    });
  });
  it('should update the status to CONNECTED and emit the event', () => {
    netatmoHandler.saveStatus({ statusType: STATUS.CONNECTED, message: null });

    expect(netatmoHandler.status).to.equal('connected');
    expect(netatmoHandler.configured).to.equal(true);
    expect(netatmoHandler.connected).to.equal(true);
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(1);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: 'netatmo.status',
      payload: { status: 'connected' },
    });
  });
  it('should update the status to DISCONNECTING and emit the event', () => {
    netatmoHandler.saveStatus({ statusType: STATUS.DISCONNECTING, message: null });

    expect(netatmoHandler.status).to.equal('disconnecting');
    expect(netatmoHandler.configured).to.equal(true);
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(1);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: 'netatmo.status',
      payload: { status: 'disconnecting' },
    });
  });
  it('should update the status to DISCONNECTED and emit the event', () => {
    sinon.spy(clock, 'clearInterval');
    const intervalPollRefreshTokenSpy = sinon.spy();
    const intervalPollRefreshValuesSpy = sinon.spy();
    netatmoHandler.pollRefreshToken = setInterval(intervalPollRefreshTokenSpy, 3600);
    netatmoHandler.pollRefreshValues = setInterval(intervalPollRefreshValuesSpy, 120);

    netatmoHandler.saveStatus({ statusType: STATUS.DISCONNECTED, message: null });

    expect(netatmoHandler.status).to.equal('disconnected');
    expect(netatmoHandler.configured).to.equal(true);
    expect(netatmoHandler.connected).to.equal(false);
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(1);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: 'netatmo.status',
      payload: { status: 'disconnected' },
    });
    clock.tick(3600 * 1000 * 2);
    assert.calledTwice(clock.clearInterval);
    expect(intervalPollRefreshTokenSpy.notCalled).to.equal(true);
    expect(intervalPollRefreshValuesSpy.notCalled).to.equal(true);
  });
  it('should update the status to DISCOVERING_DEVICES and emit the event', () => {
    netatmoHandler.saveStatus({ statusType: STATUS.DISCOVERING_DEVICES, message: null });

    expect(netatmoHandler.status).to.equal('discovering');
    expect(netatmoHandler.configured).to.equal(true);
    expect(netatmoHandler.connected).to.equal(true);
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(1);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: 'netatmo.status',
      payload: { status: 'discovering' },
    });
  });
  it('should update the status to GET_DEVICES_VALUES and emit the event', () => {
    netatmoHandler.saveStatus({ statusType: STATUS.GET_DEVICES_VALUES, message: null });

    expect(netatmoHandler.status).to.equal('get devices values');
    expect(netatmoHandler.configured).to.equal(true);
    expect(netatmoHandler.connected).to.equal(true);
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(1);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: 'netatmo.status',
      payload: { status: 'get devices values' },
    });
  });

  it('should update the status to ERROR CONNECTING and emit the event', () => {
    netatmoHandler.saveStatus({
      statusType: 'error connecting',
      message: 'error_connecting',
    });

    expect(netatmoHandler.status).to.equal('disconnected');
    expect(netatmoHandler.connected).to.equal(false);
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(2);
    expect(
      netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.CONNECTING,
        payload: { statusType: 'connecting', status: 'error_connecting' },
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(1).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
        payload: { status: 'disconnected' },
      }),
    ).to.equal(true);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: 'netatmo.status',
      payload: { status: 'disconnected' },
    });
  });

  it('should update the status to ERROR PROCESSING_TOKEN and emit the event', () => {
    netatmoHandler.saveStatus({
      statusType: 'error processing token',
      message: 'get_access_token_fail',
    });

    expect(netatmoHandler.status).to.equal('disconnected');
    expect(netatmoHandler.connected).to.equal(false);
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(2);
    expect(
      netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.PROCESSING_TOKEN,
        payload: { statusType: 'processing token', status: 'get_access_token_fail' },
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(1).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
        payload: { status: 'disconnected' },
      }),
    ).to.equal(true);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: 'netatmo.status',
      payload: { status: 'disconnected' },
    });
  });

  it('should update the status to ERROR CONNECTED and emit the event', () => {
    netatmoHandler.saveStatus({
      statusType: 'error connected',
      message: 'error_connected',
    });

    expect(netatmoHandler.status).to.equal('disconnected');
    expect(netatmoHandler.configured).to.equal(true);
    expect(netatmoHandler.connected).to.equal(false);
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(2);
    expect(
      netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.CONNECTED,
        payload: { statusType: 'connected', status: 'error_connected' },
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(1).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'disconnected' },
      }),
    ).to.equal(true);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: 'netatmo.status',
      payload: { status: 'disconnected' },
    });
  });

  it('should update the status to ERROR SET_DEVICES_VALUES and emit the event', () => {
    netatmoHandler.status = 'connected';
    netatmoHandler.saveStatus({
      statusType: 'error set devices values',
      message: 'error_set_devices_values',
    });

    expect(netatmoHandler.status).to.equal('connected');
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(2);
    expect(
      netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.error-connected',
        payload: { statusType: 'connected', status: 'error_set_devices_values' },
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(1).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'connected' },
      }),
    ).to.equal(true);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: 'netatmo.status',
      payload: { status: 'connected' },
    });
  });

  it('should update the status to ERROR GET_DEVICES_VALUES and emit the event', () => {
    netatmoHandler.status = 'connected';
    netatmoHandler.saveStatus({
      statusType: 'error get devices values',
      message: 'error_get_devices_values',
    });

    expect(netatmoHandler.status).to.equal('connected');
    expect(netatmoHandler.gladys.event.emit.callCount).to.equal(2);
    expect(
      netatmoHandler.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.error-connected',
        payload: { statusType: 'connected', status: 'error_get_devices_values' },
      }),
    ).to.equal(true);
    expect(
      netatmoHandler.gladys.event.emit.getCall(1).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'connected' },
      }),
    ).to.equal(true);
    sinon.assert.calledWith(netatmoHandler.gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: 'netatmo.status',
      payload: { status: 'connected' },
    });
  });

  it('should handle unknown status types gracefully', () => {
    const result = netatmoHandler.saveStatus({ statusType: 'unknown_status', message: null });

    expect(result).to.equal(true);
  });

  it('should return false on error', () => {
    netatmoHandler.gladys.event.emit = sinon.stub().throws(new Error('Emit failed'));

    const result = netatmoHandler.saveStatus({ statusType: STATUS.CONNECTED, message: null });
    expect(result).to.equal(false);
  });
});
