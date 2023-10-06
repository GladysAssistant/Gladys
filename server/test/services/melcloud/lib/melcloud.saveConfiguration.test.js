const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const MELCloudHandler = require('../../../../services/melcloud/lib/index');
const { GLADYS_VARIABLES } = require('../../../../services/melcloud/lib/utils/melcloud.constants');

const gladys = {
  variable: {
    setValue: fake.resolves(null),
  },
};
const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('MELCloudHandler.saveConfiguration', () => {
  const melcloudHandler = new MELCloudHandler(gladys, serviceId);

  beforeEach(() => {
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should save configuration', async () => {
    const configuration = {
      username: 'username',
      password: 'password',
    };

    const config = await melcloudHandler.saveConfiguration(configuration);

    expect(config).to.deep.eq(configuration);

    assert.callCount(gladys.variable.setValue, 2);
    assert.calledWith(gladys.variable.setValue, GLADYS_VARIABLES.USERNAME, 'username', serviceId);
    assert.calledWith(gladys.variable.setValue, GLADYS_VARIABLES.PASSWORD, 'password', serviceId);
  });
});
