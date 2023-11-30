const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const NetatmoContext = require('../netatmo.mock.test');

const NetatmoHandler = proxyquire('../../../../services/netatmo/lib/index', {
  NetatmoContext,
});

const { STATUS } = require('../../../../services/netatmo/lib/utils/netatmo.constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const { assert, fake } = sinon;

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';
// const netatmoHandler = new NetatmoHandler(gladys, serviceId);

describe('NetatmoHandler.disconnect', () => {
  let netatmoHandler
  beforeEach(() => {
    sinon.reset();
    netatmoHandler = new NetatmoHandler(gladys, serviceId);
  });
  afterEach(() => {
    sinon.reset();
  });

  it('should reset attributes', () => {
    const setTokensSpy = sinon.spy(netatmoHandler, 'setTokens');
    netatmoHandler.disconnect(netatmoHandler);
    expect(setTokensSpy.calledWith(sinon.match.has('access_token', ''))).to.be.true;
    expect(setTokensSpy.calledWith(sinon.match.has('refresh_token', ''))).to.be.true;
    expect(setTokensSpy.calledWith(sinon.match.has('expire_in', 0))).to.be.true;
    expect(setTokensSpy.calledWith(sinon.match.has('connected', false))).to.be.true;
    expect(netatmoHandler.status).to.eq(STATUS.DISCONNECTED);
    // Checking the events emits
    assert.callCount(gladys.event.emit, 2);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
      payload: { status: STATUS.DISCONNECTING },
    });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
      payload: { status: STATUS.DISCONNECTED },
    });
    // Cleaning
    setTokensSpy.resetHistory();
  });
});
