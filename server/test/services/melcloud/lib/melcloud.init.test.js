const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const MELCloudHandler = require('../../../../services/melcloud/lib/index');
const { STATUS, GLADYS_VARIABLES } = require('../../../../services/melcloud/lib/utils/melcloud.constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const gladys = {
  variable: {
    getValue: sinon.stub(),
  },
  event: {
    emit: fake.returns(null),
  },
};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

const client = {
  post: fake.resolves({ data: { LoginData: { ContextKey: 'ContextKey' } } }),
};

describe('MELCloudHandler.init', () => {
  const melcloudHandler = new MELCloudHandler(gladys, serviceId, client);

  beforeEach(() => {
    sinon.reset();
    melcloudHandler.status = 'UNKNOWN';
  });

  afterEach(() => {
    sinon.reset();
  });

  it('well initialized', async () => {
    gladys.variable.getValue
      .withArgs(GLADYS_VARIABLES.USERNAME, serviceId)
      .returns('username')
      .withArgs(GLADYS_VARIABLES.PASSWORD, serviceId)
      .returns('password');

    await melcloudHandler.init();

    expect(melcloudHandler.status).to.eq(STATUS.CONNECTED);

    assert.callCount(gladys.variable.getValue, 2);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.USERNAME, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.PASSWORD, serviceId);

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
});
