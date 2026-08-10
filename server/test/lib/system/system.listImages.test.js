const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

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

describe('system.listImages', () => {
  let system;

  beforeEach(async () => {
    system = new System(sequelize, event, config, job);
    await system.init();
    // Reset all fakes invoked within init call (the Dockerode mock fakes live
    // in the mock file's own sandbox, hence the dedicated reset)
    sinon.reset();
    DockerodeMock.resetMockHistory();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should failed as not on docker env', async () => {
    system.dockerode = undefined;

    try {
      await system.listImages();
      assert.fail('should have fail');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);
    }
  });

  it('should return the images of the machine', async () => {
    const images = await system.listImages();

    expect(images).to.deep.equal([
      {
        id: '0f72aecf-4a85-4b00-86c4-43dbdf9c8c05',
        tags: ['gladysassistant/gladys-4-playground'],
        labels: {},
        size: undefined,
        created_at: undefined,
      },
      {
        id: '3eb811ca-e050-4324-a6fa-a7a09141b4fa',
        tags: ['nickfedor/watchtower'],
        labels: {},
        size: undefined,
        created_at: undefined,
      },
    ]);
  });

  it('should forward the filters to Docker and map labels, size and creation date', async () => {
    system.dockerode.listImages = fake.resolves([
      {
        Id: 'sha256:abc',
        RepoTags: ['ghcr.io/john/demo:1.2.0'],
        Labels: { 'io.gladysassistant.manifest': '{"manifest_version":1}' },
        Size: 123,
        Created: 1700000000,
      },
    ]);

    const options = { filters: { label: ['io.gladysassistant.manifest'] } };
    const images = await system.listImages(options);

    assert.calledWith(system.dockerode.listImages, options);
    expect(images).to.deep.equal([
      {
        id: 'sha256:abc',
        tags: ['ghcr.io/john/demo:1.2.0'],
        labels: { 'io.gladysassistant.manifest': '{"manifest_version":1}' },
        size: 123,
        created_at: 1700000000,
      },
    ]);
  });

  it('should report an untagged image as having no tag', async () => {
    system.dockerode.listImages = fake.resolves([
      { Id: 'sha256:no-repo-tags' },
      { Id: 'sha256:none-placeholder', RepoTags: ['<none>:<none>', ''] },
    ]);

    const images = await system.listImages();

    expect(images.map((image) => image.tags)).to.deep.equal([[], []]);
  });
});
