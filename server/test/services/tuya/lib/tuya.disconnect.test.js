const { expect } = require('chai');
const sinon = require('sinon');

const TuyaHandler = require('../../../../services/tuya/lib/index');
const { STATUS } = require('../../../../services/tuya/lib/utils/tuya.constants');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const gladys = {
  event: {
    emit: sinon.fake.returns(null),
  },
};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('TuyaHandler.disconnect', () => {
  const tuyaHandler = new TuyaHandler(gladys, serviceId);

  beforeEach(() => {
    tuyaHandler.status = 'UNKNOWN';
    tuyaHandler.lastError = 'previous-error';
    gladys.event.emit.resetHistory();
  });

  it('should reset attributes', () => {
    tuyaHandler.disconnect();

    expect(tuyaHandler.status).to.eq(STATUS.NOT_INITIALIZED);
    expect(tuyaHandler.connector).to.eq(null);
    expect(tuyaHandler.lastError).to.eq(null);
    sinon.assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.TUYA.STATUS,
      payload: { status: STATUS.NOT_INITIALIZED, manual_disconnect: false },
    });
  });

  it('should send manual disconnect status', () => {
    tuyaHandler.disconnect({ manual: true });

    sinon.assert.calledWith(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.TUYA.STATUS,
      payload: { status: STATUS.NOT_INITIALIZED, manual_disconnect: true },
    });
  });
});
