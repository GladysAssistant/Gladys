const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const MELCloudHandler = require('../../../../services/melcloud/lib/index');
const { STATUS } = require('../../../../services/melcloud/lib/utils/melcloud.constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

const gladys = {
  event: {
    emit: fake.returns(null),
  },
};

const client = {
  post: fake.resolves({ data: { LoginData: { ContextKey: 'context-key' } } }),
};

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('MELCloudHandler.connect', () => {
  const melcloudHandler = new MELCloudHandler(gladys, serviceId, client);

  beforeEach(() => {
    sinon.reset();
    melcloudHandler.status = 'UNKNOWN';
  });

  afterEach(() => {
    sinon.reset();
  });

  it('no username stored, should fail', async () => {
    try {
      await melcloudHandler.connect({
        password: 'password',
      });
      assert.fail();
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
    }

    expect(melcloudHandler.status).to.eq(STATUS.NOT_INITIALIZED);

    assert.notCalled(gladys.event.emit);
    assert.notCalled(client.post);
  });

  it('no password stored, should fail', async () => {
    try {
      await melcloudHandler.connect({
        username: 'username',
      });
      assert.fail();
    } catch (e) {
      expect(e).to.be.instanceOf(ServiceNotConfiguredError);
    }

    expect(melcloudHandler.status).to.eq(STATUS.NOT_INITIALIZED);

    assert.notCalled(gladys.event.emit);
    assert.notCalled(client.post);
  });

  it('well connected', async () => {
    await melcloudHandler.connect({
      username: 'username',
      password: 'password',
    });

    expect(melcloudHandler.status).to.eq(STATUS.CONNECTED);

    assert.calledOnce(client.post);

    assert.callCount(gladys.event.emit, 2);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MELCLOUD.STATUS,
      payload: { status: STATUS.CONNECTING },
    });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MELCLOUD.STATUS,
      payload: { status: STATUS.CONNECTED },
    });
  });

  it('error while connecting', async () => {
    client.post = fake.throws('error');

    await melcloudHandler.connect({
      username: 'username',
      password: 'password',
    });

    expect(melcloudHandler.status).to.eq(STATUS.ERROR);

    assert.calledOnce(client.post);

    assert.callCount(gladys.event.emit, 2);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MELCLOUD.STATUS,
      payload: { status: STATUS.CONNECTING },
    });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MELCLOUD.STATUS,
      payload: { status: STATUS.ERROR },
    });
  });

  it('invalid username or password while connecting', async () => {
    client.post = fake.resolves({ data: { ErrorId: 1000, ErrorMessage: 'error' } });

    await melcloudHandler.connect({
      username: 'username',
      password: 'password',
    });

    expect(melcloudHandler.status).to.eq(STATUS.ERROR);

    assert.calledOnce(client.post);

    assert.callCount(gladys.event.emit, 2);
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MELCLOUD.STATUS,
      payload: { status: STATUS.CONNECTING },
    });
    assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MELCLOUD.STATUS,
      payload: { status: STATUS.ERROR },
    });
  });
});
