const sinon = require('sinon');

const { assert } = sinon;

const TuyaHandler = require('../../../../services/tuya/lib/index');
const { GLADYS_VARIABLES } = require('../../../../services/tuya/lib/utils/tuya.constants');

const gladys = {
  variable: {
    setValue: sinon.fake.resolves(null),
  },
};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('TuyaHandler.manualDisconnect', () => {
  const tuyaHandler = new TuyaHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should persist manual disconnect and call disconnect', async () => {
    const disconnectStub = sinon.stub().resolves(null);
    tuyaHandler.disconnect = disconnectStub;

    await tuyaHandler.manualDisconnect();

    assert.calledWith(gladys.variable.setValue, GLADYS_VARIABLES.MANUAL_DISCONNECT, 'true', serviceId);
    assert.calledWith(disconnectStub, { manual: true });
  });
});
