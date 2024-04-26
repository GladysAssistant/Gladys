const { expect } = require('chai');
const sinon = require('sinon');

const { assert } = sinon;

const MELCloudHandler = require('../../../../services/melcloud/lib/index');
const { GLADYS_VARIABLES } = require('../../../../services/melcloud/lib/utils/melcloud.constants');

const gladys = {
  variable: {
    getValue: sinon.stub(),
  },
};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('MELCloudHandler.getConfiguration', () => {
  const melcloudHandler = new MELCloudHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should load configuration', async () => {
    gladys.variable.getValue
      .withArgs(GLADYS_VARIABLES.USERNAME, serviceId)
      .returns('username')
      .withArgs(GLADYS_VARIABLES.PASSWORD, serviceId)
      .returns('password');

    const config = await melcloudHandler.getConfiguration();

    expect(config).to.deep.eq({
      username: 'username',
      password: 'password',
    });

    assert.callCount(gladys.variable.getValue, 2);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.USERNAME, serviceId);
    assert.calledWith(gladys.variable.getValue, GLADYS_VARIABLES.PASSWORD, serviceId);
  });
});
