const { expect } = require('chai');
const sinon = require('sinon');

const { assert } = sinon;

const TuyaHandler = require('../../../../services/tuya/lib/index');
const { GLADYS_VARIABLES, STATUS } = require('../../../../services/tuya/lib/utils/tuya.constants');

const gladys = {
  variable: {
    getValue: sinon.stub(),
  },
};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('TuyaHandler.getStatus', () => {
  const tuyaHandler = new TuyaHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should return configured=false when credentials are missing', async () => {
    gladys.variable.getValue
      .withArgs(GLADYS_VARIABLES.ENDPOINT, serviceId)
      .returns(null)
      .withArgs(GLADYS_VARIABLES.ACCESS_KEY, serviceId)
      .returns('accessKey')
      .withArgs(GLADYS_VARIABLES.SECRET_KEY, serviceId)
      .returns('secretKey')
      .withArgs(GLADYS_VARIABLES.MANUAL_DISCONNECT, serviceId)
      .returns(null);

    tuyaHandler.status = STATUS.NOT_INITIALIZED;
    tuyaHandler.lastError = null;

    const status = await tuyaHandler.getStatus();

    expect(status).to.deep.eq({
      status: STATUS.NOT_INITIALIZED,
      connected: false,
      configured: false,
      error: null,
      manual_disconnect: false,
    });

    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.ENDPOINT, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.ACCESS_KEY, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.SECRET_KEY, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.MANUAL_DISCONNECT, serviceId);
  });

  it('should return manual_disconnect=true when stored as string', async () => {
    gladys.variable.getValue
      .withArgs(GLADYS_VARIABLES.ENDPOINT, serviceId)
      .returns('endpoint')
      .withArgs(GLADYS_VARIABLES.ACCESS_KEY, serviceId)
      .returns('accessKey')
      .withArgs(GLADYS_VARIABLES.SECRET_KEY, serviceId)
      .returns('secretKey')
      .withArgs(GLADYS_VARIABLES.MANUAL_DISCONNECT, serviceId)
      .returns('1');

    tuyaHandler.status = STATUS.CONNECTED;
    tuyaHandler.lastError = 'nope';

    const status = await tuyaHandler.getStatus();

    expect(status).to.deep.eq({
      status: STATUS.CONNECTED,
      connected: true,
      configured: true,
      error: 'nope',
      manual_disconnect: true,
    });
  });
});
