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

describe('TuyaHandler.setTokens', () => {
  const tuyaHandler = new TuyaHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should store tokens', async () => {
    const tokens = {
      access_token: 'access',
      refresh_token: 'refresh',
      expire_time: 'expire',
    };

    await tuyaHandler.setTokens(tokens);

    assert.callCount(gladys.variable.setValue, 2);
    assert.calledWith(gladys.variable.setValue, GLADYS_VARIABLES.ACCESS_TOKEN, 'access', serviceId);
    assert.calledWith(gladys.variable.setValue, GLADYS_VARIABLES.REFRESH_TOKEN, 'refresh', serviceId);
  });
});
