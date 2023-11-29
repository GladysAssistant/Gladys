const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const NetatmoContext = require('../netatmo.mock.test');

const NetatmoHandler = proxyquire('../../../../services/netatmo/lib/index', {
  NetatmoContext,
});
const { STATUS } = require('../../../../services/netatmo/lib/utils/netatmo.constants');
const { WEBSOCKET_MESSAGE_TYPES, EVENTS } = require('../../../../utils/constants');

const { assert, fake } = sinon;

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';
const netatmoHandler = new NetatmoHandler(gladys, serviceId);

const status = {
  configured: false,
  connected: false,
  status: 'not_initialized',
};

describe('NetatmoHandler.saveStatus', () => {
  beforeEach(() => {
    netatmoHandler.configured = false;
    netatmoHandler.connected = false;
    netatmoHandler.status = STATUS.NOT_INITIALIZED;
    sinon.reset();
  });
  afterEach(() => {
    sinon.reset();
  });
  it('should save and output Netatmo status in case of error during connection', async () => {
    const result = await netatmoHandler.saveStatus({ statusType: STATUS.ERROR.CONNECTING, message: 'error_connecting' });

    expect(result).to.be.true;
    expect(netatmoHandler.status).to.eq(STATUS.DISCONNECTED);
    expect(netatmoHandler.configured).to.eq(status.configured);
    expect(netatmoHandler.connected).to.eq(status.connected);
    assert.callCount(gladys.event.emit, 2);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.CONNECTING,
      payload: { statusType: STATUS.CONNECTING, status: 'error_connecting' },
    });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
      payload: { status: STATUS.DISCONNECTED },
    });
  });
  it('should save and output Netatmo status in case of error when connected', async () => {
    const result = await netatmoHandler.saveStatus({ statusType: STATUS.ERROR.CONNECTED, message: 'error_when_connected' });

    expect(result).to.be.true;
    expect(netatmoHandler.status).to.eq(STATUS.DISCONNECTED);
    expect(netatmoHandler.configured).to.eq(true);
    expect(netatmoHandler.connected).to.eq(status.connected);
    assert.callCount(gladys.event.emit, 2);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.ERROR.CONNECTED,
      payload: { statusType: STATUS.CONNECTED, status: 'error_when_connected' },
    });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
      payload: { status: STATUS.DISCONNECTED },
    });
  });
  it('should save and output Netatmo status in case of no specify', async () => {
    const result = await netatmoHandler.saveStatus({ statusType: '', message: 'error_when_connected' });

    expect(result).to.be.true;
    expect(netatmoHandler.status).to.eq(status.status);
    expect(netatmoHandler.configured).to.eq(status.configured);
    expect(netatmoHandler.connected).to.eq(status.connected);
    assert.callCount(gladys.event.emit, 1);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
      payload: { status: status.status },
    });
  });
  it('should fail save', async () => {
    const result = await netatmoHandler.saveStatus();

    expect(result).to.be.false;
    expect(netatmoHandler.status).to.eq(status.status);
    expect(netatmoHandler.configured).to.eq(status.configured);
    expect(netatmoHandler.connected).to.eq(status.connected);
    assert.callCount(gladys.event.emit, 0);
  });
});