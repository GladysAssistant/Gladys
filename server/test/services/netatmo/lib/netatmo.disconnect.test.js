const { expect } = require('chai');
const sinon = require('sinon');
const EventEmitter = require('events');

const { assert } = sinon;
const { disconnect } = require('../../../../services/netatmo/lib/netatmo.disconnect');
const { NetatmoHandlerMock } = require('../netatmo.mock.test');
const netatmoStatus = require('../../../../services/netatmo/lib/netatmo.status');
const { EVENTS } = require('../../../../utils/constants');

describe('Netatmo Disconnect', () => {
  let eventEmitter;
  let clock;

  beforeEach(() => {
    sinon.reset();
    clock = sinon.useFakeTimers();

    eventEmitter = new EventEmitter();
    NetatmoHandlerMock.gladys = { event: eventEmitter };
    sinon.spy(NetatmoHandlerMock.gladys.event, 'emit');

    NetatmoHandlerMock.saveStatus = sinon.stub().callsFake(netatmoStatus.saveStatus);
    NetatmoHandlerMock.status = 'not_initialized';
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });
  it('should properly disconnect from Netatmo', () => {
    sinon.spy(clock, 'clearInterval');
    const intervalPollRefreshTokenSpy = sinon.spy();
    const intervalPollRefreshValuesSpy = sinon.spy();
    NetatmoHandlerMock.pollRefreshToken = setInterval(intervalPollRefreshTokenSpy, 3600 * 1000);
    NetatmoHandlerMock.pollRefreshValues = setInterval(intervalPollRefreshValuesSpy, 120 * 1000);

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

    clock.tick(3600 * 1000 * 2);
    assert.calledTwice(clock.clearInterval);
    expect(intervalPollRefreshTokenSpy.notCalled).to.equal(true);
    expect(intervalPollRefreshValuesSpy.notCalled).to.equal(true);
  });
});
