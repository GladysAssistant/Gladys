const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const MELCloudHomeHandler = require('../../../../services/melcloud-home/lib');
const { GLADYS_VARIABLES } = require('../../../../services/melcloud-home/lib/utils/melcloud-home.constants');

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('MELCloudHomeHandler.saveConfiguration', () => {
  it('should save username and password', async () => {
    const gladys = {
      variable: {
        setValue: fake.resolves(null),
      },
    };
    const handler = new MELCloudHomeHandler(gladys, serviceId, {});

    const configuration = { username: 'user', password: 'pass' };
    const result = await handler.saveConfiguration(configuration);

    expect(result).to.deep.equal(configuration);
    assert.calledWith(gladys.variable.setValue, GLADYS_VARIABLES.USERNAME, 'user', serviceId);
    assert.calledWith(gladys.variable.setValue, GLADYS_VARIABLES.PASSWORD, 'pass', serviceId);
  });
});
