const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const NetatmoContext = require('../netatmo.mock.test');

const { assert, fake } = sinon;

const NetatmoHandler = proxyquire('../../../../services/netatmo/lib/index', {
  NetatmoContext
});
const { STATUS, GLADYS_VARIABLES } = require('../../../../services/netatmo/lib/utils/netatmo.constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

const gladys = {
  variable: {
    getValue: sinon.stub(),
  },
  event: {
    emit: fake.returns(null),
  },
};
const serviceId = 'ecca4d93-7a8c-4761-9055-fc15460a4b4a';
const netatmoHandler = new NetatmoHandler(gladys, serviceId);

describe.only('NetatmoHandler.init', () => {

  beforeEach(() => {
    sinon.reset();
    netatmoHandler.status = 'UNKNOWN';
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should not initialized and receive error', async () => {
    gladys.variable.getValue
      .withArgs(GLADYS_VARIABLES.USERNAME, serviceId)
      .returns('username')

    try {
      await netatmoHandler.init();
    } catch (e) {
      assert.callCount(gladys.event.emit, 1);
      assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
        type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
        payload: { status: STATUS.NOT_INITIALIZED },
      });
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
    }
  });
  it('should not initialized, disconnect state with no Access Token and errored stored Tokens', async () => {
    gladys.variable.getValue
      .withArgs(GLADYS_VARIABLES.USERNAME, serviceId)
      .returns('username')
      .withArgs(GLADYS_VARIABLES.CLIENT_ID, serviceId)
      .returns('clientId')
      .withArgs(GLADYS_VARIABLES.CLIENT_SECRET, serviceId)
      .returns('clientSecret')

    await netatmoHandler.init();
    assert.callCount(gladys.variable.getValue, 6);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.USERNAME, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.CLIENT_ID, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.CLIENT_SECRET, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.SCOPE_ENERGY, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.CONNECTED, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.ACCESS_TOKEN, serviceId);
    expect(netatmoHandler.status).to.eq(STATUS.DISCONNECTED);
    expect(netatmoHandler.configured).to.eq(true);
    assert.callCount(gladys.event.emit, 1);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
      payload: { status: STATUS.DISCONNECTED },
    });
  });
  it('should not initialized, disconnect state with no Refresh Token and errored stored Tokens', async () => {
    gladys.variable.getValue
      .withArgs(GLADYS_VARIABLES.USERNAME, serviceId)
      .returns('username')
      .withArgs(GLADYS_VARIABLES.CLIENT_ID, serviceId)
      .returns('clientId')
      .withArgs(GLADYS_VARIABLES.CLIENT_SECRET, serviceId)
      .returns('clientSecret')
      .withArgs(GLADYS_VARIABLES.ACCESS_TOKEN, serviceId)
      .returns('accessToken')

    await netatmoHandler.init();
    assert.callCount(gladys.variable.getValue, 8);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.REFRESH_TOKEN, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.EXPIRE_IN_TOKEN, serviceId);
    expect(netatmoHandler.status).to.eq(STATUS.DISCONNECTED);
    expect(netatmoHandler.configured).to.eq(true);
    assert.callCount(gladys.event.emit, 1);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
      payload: { status: STATUS.DISCONNECTED },
    });
  });
  it('should not initialized, refreshing Token fail', async () => {
    gladys.variable.getValue
      .withArgs(GLADYS_VARIABLES.USERNAME, serviceId)
      .returns('username')
      .withArgs(GLADYS_VARIABLES.CLIENT_ID, serviceId)
      .returns('clientId')
      .withArgs(GLADYS_VARIABLES.CLIENT_SECRET, serviceId)
      .returns('clientSecret')
      .withArgs(GLADYS_VARIABLES.ACCESS_TOKEN, serviceId)
      .returns('accessToken')
      .withArgs(GLADYS_VARIABLES.REFRESH_TOKEN, serviceId)
      .returns('refreshToken')

    netatmoHandler.refreshingTokens = fake.returns({ success: false });
    await netatmoHandler.init();
    assert.callCount(gladys.variable.getValue, 8);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.REFRESH_TOKEN, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.EXPIRE_IN_TOKEN, serviceId);
    expect(netatmoHandler.status).to.eq(STATUS.ERROR);
    expect(netatmoHandler.configured).to.eq(true);
    assert.callCount(gladys.event.emit, 1);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
      payload: { status: STATUS.ERROR },
    });
  });
  it('should initialized ', async () => {
    gladys.variable.getValue
      .withArgs(GLADYS_VARIABLES.USERNAME, serviceId)
      .returns('username')
      .withArgs(GLADYS_VARIABLES.CLIENT_ID, serviceId)
      .returns('clientId')
      .withArgs(GLADYS_VARIABLES.CLIENT_SECRET, serviceId)
      .returns('clientSecret')
      .withArgs(GLADYS_VARIABLES.SCOPE_ENERGY, serviceId)
      .returns('scopeEnergy')
      .withArgs(GLADYS_VARIABLES.ACCESS_TOKEN, serviceId)
      .returns('accessToken')
      .withArgs(GLADYS_VARIABLES.REFRESH_TOKEN, serviceId)
      .returns('refreshToken')
      .withArgs(GLADYS_VARIABLES.EXPIRE_IN_TOKEN, serviceId)
      .returns(10800);

    netatmoHandler.refreshingTokens = fake.returns({ success: true });
    await netatmoHandler.init();

    assert.callCount(gladys.variable.getValue, 8);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.USERNAME, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.CLIENT_ID, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.CLIENT_SECRET, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.SCOPE_ENERGY, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.CONNECTED, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.ACCESS_TOKEN, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.REFRESH_TOKEN, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.EXPIRE_IN_TOKEN, serviceId);

    assert.callCount(gladys.event.emit, 1);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.NETATMO.STATUS,
      payload: { status: STATUS.CONNECTED },
    });
    expect(netatmoHandler.status).to.eq(STATUS.CONNECTED);
  });
});
