const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const TuyaHandler = require('../../../../services/tuya/lib/index');
const { GLADYS_VARIABLES } = require('../../../../services/tuya/lib/utils/tuya.constants');

const gladys = {
  variable: {
    getValue: fake.resolves('refresh_token'),
  },
};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('TuyaHandler.getRefreshToken', () => {
  const tuyaHandler = new TuyaHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should load refresh token', async () => {
    const refreshToken = await tuyaHandler.getRefreshToken();

    assert.calledOnce(gladys.variable.getValue);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.REFRESH_TOKEN, serviceId);

    expect(refreshToken).to.eq('refresh_token');
  });
});
