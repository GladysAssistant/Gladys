const { expect } = require('chai');
const sinon = require('sinon');
const EventEmitter = require('events');
const { disconnect } = require('../../../../services/netatmo/lib/netatmo.disconnect');
const { NetatmoHandlerMock } = require('../netatmo.mock.test');
const netatmoStatus = require('../../../../services/netatmo/lib/netatmo.status');
const { EVENTS } = require('../../../../utils/constants');

describe('Netatmo Disconnect', () => {
  let eventEmitter;
  let fakeIntervalId;

  beforeEach(() => {
    sinon.reset();

    eventEmitter = new EventEmitter();
    NetatmoHandlerMock.gladys = { event: eventEmitter };
    sinon.spy(NetatmoHandlerMock.gladys.event, 'emit');

    NetatmoHandlerMock.saveStatus = sinon.stub().callsFake(netatmoStatus.saveStatus);
    NetatmoHandlerMock.status = 'not_initialized';
    fakeIntervalId = setTimeout(() => {}, 1000);
    sinon.stub(global, 'setInterval').returns(fakeIntervalId);
    sinon.stub(global, 'clearInterval');
  });

  afterEach(() => {
    sinon.reset();
  });
  it('should properly disconnect from Netatmo', () => {
    NetatmoHandlerMock.pollRefreshToken = fakeIntervalId;
    disconnect(NetatmoHandlerMock);

    expect(NetatmoHandlerMock.gladys.event.emit.callCount).to.equal(2);
    expect(
      NetatmoHandlerMock.gladys.event.emit.getCall(0).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'disconnecting' },
      }),
    ).to.equal(true);
    expect(
      NetatmoHandlerMock.gladys.event.emit.getCall(1).calledWith(EVENTS.WEBSOCKET.SEND_ALL, {
        type: 'netatmo.status',
        payload: { status: 'disconnected' },
      }),
    ).to.equal(true);
    // @ts-ignore
    expect(global.clearInterval.calledWith(fakeIntervalId)).to.equal(true);
  });
});
