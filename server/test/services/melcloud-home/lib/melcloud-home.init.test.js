const sinon = require('sinon');

const { assert, fake } = sinon;

const MELCloudHomeHandler = require('../../../../services/melcloud-home/lib');

const serviceId = 'ffa13430-df93-488a-9733-5c540e9558e0';

describe('MELCloudHomeHandler.init', () => {
  const handler = new MELCloudHomeHandler({}, serviceId, {});

  beforeEach(() => {
    sinon.reset();
  });

  it('should get configuration and connect', async () => {
    const configuration = { username: 'user', password: 'pass', refreshToken: null };
    handler.getConfiguration = fake.resolves(configuration);
    handler.connect = fake.resolves(null);

    await handler.init();

    assert.calledOnce(handler.getConfiguration);
    assert.calledWith(handler.connect, configuration);
  });
});
