const { expect } = require('chai');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const { TuyaContext, client } = require('../tuya.mock.test');

const { assert, fake } = sinon;

const connect = proxyquire('../../../../services/tuya/lib/tuya.connect', {
  '@tuya/tuya-connector-nodejs': { TuyaContext },
});
const TuyaHandler = proxyquire('../../../../services/tuya/lib/index', {
  './tuya.connect.js': connect,
});
const { STATUS, GLADYS_VARIABLES } = require('../../../../services/tuya/lib/utils/tuya.constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const gladys = {
  variable: {
    getValue: sinon.stub(),
    setValue: sinon.stub().resolves(null),
  },
  event: {
    emit: fake.returns(null),
  },
};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('TuyaHandler.init', () => {
  const tuyaHandler = new TuyaHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
    tuyaHandler.status = 'UNKNOWN';
    tuyaHandler.autoReconnectAllowed = false;
    tuyaHandler.lastError = 'previous-error';
  });

  afterEach(() => {
    sinon.reset();
  });

  it('well initialized', async () => {
    gladys.variable.getValue
      .withArgs(GLADYS_VARIABLES.ENDPOINT, serviceId)
      .returns('apiUrl')
      .withArgs(GLADYS_VARIABLES.ACCESS_KEY, serviceId)
      .returns('accessKey')
      .withArgs(GLADYS_VARIABLES.SECRET_KEY, serviceId)
      .returns('secretKey')
      .withArgs(GLADYS_VARIABLES.APP_ACCOUNT_UID, serviceId)
      .returns('appAccountId')
      .withArgs(GLADYS_VARIABLES.APP_USERNAME, serviceId)
      .returns('appUsername')
      .withArgs(GLADYS_VARIABLES.LAST_CONNECTED_CONFIG_HASH, serviceId)
      .returns(null)
      .withArgs(GLADYS_VARIABLES.MANUAL_DISCONNECT, serviceId)
      .returns(null);

    await tuyaHandler.init();

    expect(tuyaHandler.status).to.eq(STATUS.CONNECTED);

    assert.callCount(gladys.variable.getValue, 7);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.ENDPOINT, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.ACCESS_KEY, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.SECRET_KEY, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.APP_ACCOUNT_UID, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.APP_USERNAME, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.LAST_CONNECTED_CONFIG_HASH, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.MANUAL_DISCONNECT, serviceId);

    assert.calledOnce(client.init);

    assert.callCount(gladys.event.emit, 2);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.TUYA.STATUS,
      payload: { status: STATUS.CONNECTING },
    });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.TUYA.STATUS,
      payload: { status: STATUS.CONNECTED, error: null },
    });
  });

  it('should not connect when manual disconnect is enabled', async () => {
    gladys.variable.getValue
      .withArgs(GLADYS_VARIABLES.ENDPOINT, serviceId)
      .returns('apiUrl')
      .withArgs(GLADYS_VARIABLES.ACCESS_KEY, serviceId)
      .returns('accessKey')
      .withArgs(GLADYS_VARIABLES.SECRET_KEY, serviceId)
      .returns('secretKey')
      .withArgs(GLADYS_VARIABLES.APP_ACCOUNT_UID, serviceId)
      .returns('appAccountId')
      .withArgs(GLADYS_VARIABLES.APP_USERNAME, serviceId)
      .returns('appUsername')
      .withArgs(GLADYS_VARIABLES.LAST_CONNECTED_CONFIG_HASH, serviceId)
      .returns(null)
      .withArgs(GLADYS_VARIABLES.MANUAL_DISCONNECT, serviceId)
      .returns('1');

    await tuyaHandler.init();

    expect(tuyaHandler.status).to.eq(STATUS.NOT_INITIALIZED);

    assert.notCalled(client.init);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.TUYA.STATUS,
      payload: { status: STATUS.NOT_INITIALIZED, manual_disconnect: true },
    });
  });

  it('should allow auto-reconnect when last connected hash matches current config', async () => {
    gladys.variable.getValue
      .withArgs(GLADYS_VARIABLES.ENDPOINT, serviceId)
      .returns('apiUrl')
      .withArgs(GLADYS_VARIABLES.ACCESS_KEY, serviceId)
      .returns('accessKey')
      .withArgs(GLADYS_VARIABLES.SECRET_KEY, serviceId)
      .returns('secretKey')
      .withArgs(GLADYS_VARIABLES.APP_ACCOUNT_UID, serviceId)
      .returns('appAccountId')
      .withArgs(GLADYS_VARIABLES.APP_USERNAME, serviceId)
      .returns('appUsername')
      .withArgs(GLADYS_VARIABLES.LAST_CONNECTED_CONFIG_HASH, serviceId)
      .returns('9fa6af9a941ec217207b27f44ce07efcb447bb2173f4ce8f238a2aeb7ad9f8ea')
      .withArgs(GLADYS_VARIABLES.MANUAL_DISCONNECT, serviceId)
      .returns(false);

    await tuyaHandler.init();

    expect(tuyaHandler.autoReconnectAllowed).to.equal(true);
    assert.calledOnce(client.init);
  });

  it('should connect with null configuration when no config is stored', async () => {
    const connectStub = sinon.stub(tuyaHandler, 'connect').resolves();
    const getConfigurationStub = sinon.stub(tuyaHandler, 'getConfiguration').resolves(null);
    gladys.variable.getValue
      .withArgs(GLADYS_VARIABLES.LAST_CONNECTED_CONFIG_HASH, serviceId)
      .returns('some-hash')
      .withArgs(GLADYS_VARIABLES.MANUAL_DISCONNECT, serviceId)
      .returns(0);

    await tuyaHandler.init();

    expect(tuyaHandler.autoReconnectAllowed).to.equal(false);
    assert.calledOnce(getConfigurationStub);
    assert.calledOnce(connectStub);
    assert.calledWith(connectStub, null);

    connectStub.restore();
    getConfigurationStub.restore();
  });
});
