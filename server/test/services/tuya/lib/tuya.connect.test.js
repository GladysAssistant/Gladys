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
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

const gladys = {
  event: {
    emit: fake.returns(null),
  },
  variable: {
    setValue: fake.resolves(null),
  },
};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('TuyaHandler.connect', () => {
  const tuyaHandler = new TuyaHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
    tuyaHandler.status = 'UNKNOWN';
  });

  afterEach(() => {
    sinon.reset();
  });

  it('no url stored, should fail', async () => {
    try {
      await tuyaHandler.connect({
        accessKey: 'accessKey',
        secretKey: 'secretKey',
      });
      assert.fail();
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
    }

    expect(tuyaHandler.status).to.eq(STATUS.NOT_INITIALIZED);

    assert.notCalled(gladys.event.emit);
    assert.notCalled(client.init);
    assert.notCalled(gladys.variable.setValue);
  });

  it('no access key stored, should fail', async () => {
    try {
      await tuyaHandler.connect({
        baseUrl: 'apiUrl',
        secretKey: 'secretKey',
      });
      assert.fail();
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
    }

    expect(tuyaHandler.status).to.eq(STATUS.NOT_INITIALIZED);

    assert.notCalled(gladys.event.emit);
    assert.notCalled(client.init);
    assert.notCalled(gladys.variable.setValue);
  });

  it('no secret key stored, should fail', async () => {
    try {
      await tuyaHandler.connect({
        baseUrl: 'apiUrl',
        accessKey: 'accessKey',
      });
      assert.fail();
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
    }

    expect(tuyaHandler.status).to.eq(STATUS.NOT_INITIALIZED);

    assert.notCalled(gladys.event.emit);
    assert.notCalled(client.init);
    assert.notCalled(gladys.variable.setValue);
  });

  it('well connected', async () => {
    await tuyaHandler.connect({
      baseUrl: 'apiUrl',
      accessKey: 'accessKey',
      secretKey: 'secretKey',
      appAccountId: 'appAccountId',
    });

    expect(tuyaHandler.status).to.eq(STATUS.CONNECTED);

    assert.calledOnce(client.init);
    assert.calledTwice(gladys.variable.setValue);
    assert.calledWith(gladys.variable.setValue, GLADYS_VARIABLES.MANUAL_DISCONNECT, 'false', serviceId);
    assert.calledWith(
      gladys.variable.setValue,
      GLADYS_VARIABLES.LAST_CONNECTED_CONFIG_HASH,
      sinon.match.string,
      serviceId,
    );

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

  it('error while connecting', async () => {
    client.init.throws();

    await tuyaHandler.connect({
      baseUrl: 'apiUrl',
      accessKey: 'accessKey',
      secretKey: 'secretKey',
      appAccountId: 'appAccountId',
    });

    expect(tuyaHandler.status).to.eq(STATUS.ERROR);

    assert.calledOnce(client.init);
    assert.notCalled(gladys.variable.setValue);

    assert.callCount(gladys.event.emit, 3);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.TUYA.STATUS,
      payload: { status: STATUS.CONNECTING },
    });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.TUYA.ERROR,
      payload: { message: 'Error' },
    });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.TUYA.STATUS,
      payload: { status: STATUS.ERROR, error: 'Error' },
    });
  });

  it('should map invalid client id error', async () => {
    client.init.rejects(new Error('GET_TOKEN_FAILED 2009, clientId is invalid'));
    tuyaHandler.autoReconnectAllowed = true;

    await tuyaHandler.connect({
      baseUrl: 'apiUrl',
      accessKey: 'accessKey',
      secretKey: 'secretKey',
      appAccountId: 'appAccountId',
    });

    expect(tuyaHandler.status).to.eq(STATUS.ERROR);
    expect(tuyaHandler.lastError).to.eq('integration.tuya.setup.errorInvalidClientId');
    expect(tuyaHandler.autoReconnectAllowed).to.equal(false);
  });

  it('should map invalid client secret error', async () => {
    client.init.rejects(new Error('GET_TOKEN_FAILED 1004, sign invalid'));
    tuyaHandler.autoReconnectAllowed = true;

    await tuyaHandler.connect({
      baseUrl: 'apiUrl',
      accessKey: 'accessKey',
      secretKey: 'secretKey',
      appAccountId: 'appAccountId',
    });

    expect(tuyaHandler.status).to.eq(STATUS.ERROR);
    expect(tuyaHandler.lastError).to.eq('integration.tuya.setup.errorInvalidClientSecret');
    expect(tuyaHandler.autoReconnectAllowed).to.equal(false);
  });

  it('should map invalid endpoint error', async () => {
    client.init.rejects(new Error('No permission. The data center is suspended.'));
    tuyaHandler.autoReconnectAllowed = true;

    await tuyaHandler.connect({
      baseUrl: 'apiUrl',
      accessKey: 'accessKey',
      secretKey: 'secretKey',
      appAccountId: 'appAccountId',
    });

    expect(tuyaHandler.status).to.eq(STATUS.ERROR);
    expect(tuyaHandler.lastError).to.eq('integration.tuya.setup.errorInvalidEndpoint');
    expect(tuyaHandler.autoReconnectAllowed).to.equal(false);
  });

  it('should map missing app account uid error', async () => {
    client.init.resolves();
    tuyaHandler.autoReconnectAllowed = true;

    await tuyaHandler.connect({
      baseUrl: 'apiUrl',
      accessKey: 'accessKey',
      secretKey: 'secretKey',
      appAccountId: '',
    });

    expect(tuyaHandler.status).to.eq(STATUS.ERROR);
    expect(tuyaHandler.lastError).to.eq('integration.tuya.setup.errorInvalidAppAccountUid');
    expect(tuyaHandler.autoReconnectAllowed).to.equal(false);
    assert.notCalled(tuyaHandler.connector.request);
  });

  it('should map invalid app account uid from api response', async () => {
    const clientStub = {
      init: sinon.stub().resolves(),
    };
    const requestStub = sinon.stub().resolves({
      success: false,
      msg: 'permission deny',
      code: 1106,
    });
    const TuyaContextStub = function TuyaContextStub() {
      this.client = clientStub;
      this.request = requestStub;
    };

    const connectWithStub = proxyquire('../../../../services/tuya/lib/tuya.connect', {
      '@tuya/tuya-connector-nodejs': { TuyaContext: TuyaContextStub },
    });
    const TuyaHandlerWithStub = proxyquire('../../../../services/tuya/lib/index', {
      './tuya.connect.js': connectWithStub,
    });
    const handler = new TuyaHandlerWithStub(gladys, serviceId);
    handler.autoReconnectAllowed = true;

    await handler.connect({
      baseUrl: 'apiUrl',
      accessKey: 'accessKey',
      secretKey: 'secretKey',
      appAccountId: 'appAccountId',
    });

    expect(handler.status).to.eq(STATUS.ERROR);
    expect(handler.lastError).to.eq('integration.tuya.setup.errorInvalidAppAccountUid');
    expect(handler.autoReconnectAllowed).to.equal(false);
    assert.calledOnce(requestStub);
  });

  it('should map invalid app account uid from empty api response', async () => {
    const clientStub = {
      init: sinon.stub().resolves(),
    };
    const requestStub = sinon.stub().resolves(null);
    const TuyaContextStub = function TuyaContextStub() {
      this.client = clientStub;
      this.request = requestStub;
    };

    const connectWithStub = proxyquire('../../../../services/tuya/lib/tuya.connect', {
      '@tuya/tuya-connector-nodejs': { TuyaContext: TuyaContextStub },
    });
    const TuyaHandlerWithStub = proxyquire('../../../../services/tuya/lib/index', {
      './tuya.connect.js': connectWithStub,
    });
    const handler = new TuyaHandlerWithStub(gladys, serviceId);
    handler.autoReconnectAllowed = true;

    await handler.connect({
      baseUrl: 'apiUrl',
      accessKey: 'accessKey',
      secretKey: 'secretKey',
      appAccountId: 'appAccountId',
    });

    expect(handler.status).to.eq(STATUS.ERROR);
    expect(handler.lastError).to.eq('integration.tuya.setup.errorInvalidAppAccountUid');
    expect(handler.autoReconnectAllowed).to.equal(false);
    assert.calledOnce(requestStub);
  });
});
