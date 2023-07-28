const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const TuyaHandler = require('../../../../services/tuya/lib/index');
const { GLADYS_VARIABLES } = require('../../../../services/tuya/lib/utils/tuya.constants');

const gladys = {
  variable: {
    setValue: fake.resolves(null),
  },
};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('TuyaHandler.saveConfiguration', () => {
  const tuyaHandler = new TuyaHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should save configuration', async () => {
    const configuration = {
      endpoint: 'endpoint',
      accessKey: 'accessKey',
      secretKey: 'secretKey',
      appAccountId: 'appAccountUID',
    };

    const config = await tuyaHandler.saveConfiguration(configuration);

    expect(config).to.deep.eq(configuration);

    assert.callCount(gladys.variable.setValue, 4);
    assert.calledWith(gladys.variable.setValue, GLADYS_VARIABLES.ENDPOINT, 'endpoint', serviceId);
    assert.calledWith(gladys.variable.setValue, GLADYS_VARIABLES.ACCESS_KEY, 'accessKey', serviceId);
    assert.calledWith(gladys.variable.setValue, GLADYS_VARIABLES.SECRET_KEY, 'secretKey', serviceId);
    assert.calledWith(gladys.variable.setValue, GLADYS_VARIABLES.APP_ACCOUNT_UID, 'appAccountUID', serviceId);
  });
});
