const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const TuyaHandler = require('../../../../services/tuya/lib/index');
const { GLADYS_VARIABLES } = require('../../../../services/tuya/lib/utils/tuya.constants');

const gladys = {
  variable: {
    getValue: fake.resolves('access_token'),
  },
};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('TuyaHandler.getAccessToken', () => {
  const tuyaHandler = new TuyaHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should load access token', async () => {
    const accessToken = await tuyaHandler.getAccessToken();

    assert.calledOnce(gladys.variable.getValue);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.ACCESS_TOKEN, serviceId);

    expect(accessToken).to.eq('access_token');
  });
});
