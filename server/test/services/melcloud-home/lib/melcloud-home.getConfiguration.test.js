const { expect } = require('chai');
const sinon = require('sinon');

const { fake } = sinon;

const MELCloudHomeHandler = require('../../../../services/melcloud-home/lib');

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('MELCloudHomeHandler.getConfiguration', () => {
  it('should load the stored configuration', async () => {
    const gladys = {
      variable: {
        getValue: fake.resolves('value'),
      },
    };
    const handler = new MELCloudHomeHandler(gladys, serviceId, {});

    const configuration = await handler.getConfiguration();

    expect(configuration).to.deep.equal({
      username: 'value',
      password: 'value',
      refreshToken: 'value',
    });
  });
});
