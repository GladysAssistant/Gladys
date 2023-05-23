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
const { STATUS } = require('../../../../services/tuya/lib/utils/tuya.constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

const gladys = {
  event: {
    emit: fake.returns(null),
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
  });

  it('well connected', async () => {
    await tuyaHandler.connect({
      baseUrl: 'apiUrl',
      accessKey: 'accessKey',
      secretKey: 'secretKey',
    });

    expect(tuyaHandler.status).to.eq(STATUS.CONNECTED);

    assert.calledOnce(client.init);

    assert.callCount(gladys.event.emit, 2);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.TUYA.STATUS,
      payload: { status: STATUS.CONNECTING },
    });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.TUYA.STATUS,
      payload: { status: STATUS.CONNECTED },
    });
  });

  it('error while connecting', async () => {
    client.init.throws();

    await tuyaHandler.connect({
      baseUrl: 'apiUrl',
      accessKey: 'accessKey',
      secretKey: 'secretKey',
    });

    expect(tuyaHandler.status).to.eq(STATUS.ERROR);

    assert.calledOnce(client.init);

    assert.callCount(gladys.event.emit, 2);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.TUYA.STATUS,
      payload: { status: STATUS.CONNECTING },
    });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.TUYA.STATUS,
      payload: { status: STATUS.ERROR },
    });
  });
});
