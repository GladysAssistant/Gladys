const { expect } = require('chai');
const sinon = require('sinon');

const { fake, assert } = sinon;

const proxyquire = require('proxyquire').noCallThru();

const { PlatformNotCompatible } = require('../../../utils/coreErrors');
const DockerodeMock = require('./DockerodeMock.test');

const System = proxyquire('../../../lib/system', {
  dockerode: DockerodeMock,
});
const Job = require('../../../lib/job');

const sequelize = {
  close: fake.resolves(null),
};

const event = {
  on: fake.resolves(null),
  emit: fake.resolves(null),
};

const job = new Job(event);

const config = {
  tempFolder: '/tmp/gladys',
};

describe('system.getImageLabels', () => {
  let system;

  beforeEach(async () => {
    system = new System(sequelize, event, config, job);
    await system.init();
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should failed as not on docker env', async () => {
    system.dockerode = undefined;

    try {
      await system.getImageLabels('my-image');
      assert.fail('should have fail');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);
    }
  });

  it('should return the labels of the image', async () => {
    const labels = await system.getImageLabels('my-image:latest');
    expect(labels).to.deep.equal({
      'io.gladysassistant.manifest': '{"manifest_version":1}',
    });
  });

  it('should return an empty object when the image has no labels', async () => {
    system.dockerode.getImage = fake.returns({
      inspect: fake.resolves({ Config: {} }),
    });
    const labels = await system.getImageLabels('my-image:latest');
    expect(labels).to.deep.equal({});
  });
});
