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
      .returns('secretKey');

    await tuyaHandler.init();

    expect(tuyaHandler.status).to.eq(STATUS.CONNECTED);

    assert.callCount(gladys.variable.getValue, 3);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.ENDPOINT, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.ACCESS_KEY, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.SECRET_KEY, serviceId);

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
});
