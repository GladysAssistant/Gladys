const { expect } = require('chai');
const sinon = require('sinon');

const { assert } = sinon;

const TuyaHandler = require('../../../../services/tuya/lib/index');
const { GLADYS_VARIABLES } = require('../../../../services/tuya/lib/utils/tuya.constants');

const gladys = {
  variable: {
    getValue: sinon.stub(),
  },
};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('TuyaHandler.getConfiguration', () => {
  const tuyaHandler = new TuyaHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should load configuration', async () => {
    gladys.variable.getValue
      .withArgs(GLADYS_VARIABLES.ENDPOINT, serviceId)
      .returns('easternAmerica')
      .withArgs(GLADYS_VARIABLES.ACCESS_KEY, serviceId)
      .returns('accessKey')
      .withArgs(GLADYS_VARIABLES.SECRET_KEY, serviceId)
      .returns('secretKey');

    const config = await tuyaHandler.getConfiguration();

    expect(config).to.deep.eq({
      baseUrl: 'https://openapi-ueaz.tuyaus.com',
      accessKey: 'accessKey',
      secretKey: 'secretKey',
    });

    assert.callCount(gladys.variable.getValue, 3);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.ENDPOINT, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.ACCESS_KEY, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.SECRET_KEY, serviceId);
  });
});
