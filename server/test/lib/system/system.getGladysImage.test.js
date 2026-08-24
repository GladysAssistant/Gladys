const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;

const proxyquire = require('proxyquire').noCallThru();

const { PlatformNotCompatible } = require('../../../utils/coreErrors');
const DockerodeMock = require('./DockerodeMock.test');
const { parseImageReference } = require('../../../lib/system/system.getGladysImage');

const System = proxyquire('../../../lib/system', {
  dockerode: DockerodeMock,
});
const Job = require('../../../lib/job');

const sequelize = {
  close: fake.resolves(null),
};

const event = {
  on: fake.resolves(null),
  emit: fake.returns(null),
};

const job = new Job(event);

const config = {
  tempFolder: process.env.TEMP_FOLDER || '/tmp/gladys',
};

describe('system.parseImageReference', () => {
  it('should parse an image with a tag', () => {
    expect(parseImageReference('gladysassistant/gladys:v4')).to.deep.equal({
      repository: 'gladysassistant/gladys',
      tag: 'v4',
      digest: undefined,
    });
  });

  it('should default to the latest tag', () => {
    expect(parseImageReference('gladysassistant/gladys')).to.deep.equal({
      repository: 'gladysassistant/gladys',
      tag: 'latest',
      digest: undefined,
    });
  });

  it('should not confuse a registry port with a tag', () => {
    expect(parseImageReference('registry.local:5000/gladysassistant/gladys')).to.deep.equal({
      repository: 'registry.local:5000/gladysassistant/gladys',
      tag: 'latest',
      digest: undefined,
    });
  });

  it('should parse an image pinned by digest', () => {
    const { repository, tag, digest } = parseImageReference('gladysassistant/gladys@sha256:abcdef');
    expect(repository).to.equal('gladysassistant/gladys');
    expect(tag).to.equal('latest');
    expect(digest).to.equal('sha256:abcdef');
  });

  it('should parse a raw image id', () => {
    expect(parseImageReference('sha256:92e700688a85')).to.deep.equal({
      repository: null,
      tag: null,
      digest: '92e700688a85',
    });
  });
});

describe('system.getGladysImage', () => {
  let system;

  beforeEach(async () => {
    system = new System(sequelize, event, config, job);
    await system.init();
    system.getGladysContainerId = fake.resolves('fb8251117cc4');
    // Reset all fakes invoked within init call
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should fail: not run inside docker', async () => {
    system.dockerode = undefined;

    try {
      await system.getGladysImage();
      assert.fail('should have fail');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);
      expect(e).to.have.property('message', 'SYSTEM_NOT_RUNNING_DOCKER');
    }
  });

  it('should describe a moving tag as upgradable', async () => {
    const gladysImage = await system.getGladysImage();
    expect(gladysImage).to.deep.equal({
      container_name: 'gladys',
      image: 'gladysassistant/gladys:v4',
      tag: 'v4',
      pinned: false,
      recommended_image: 'gladysassistant/gladys:v4',
    });
  });

  it('should detect an image pinned on an exact version', async () => {
    system.inspectContainer = fake.resolves({
      Name: '/gladys',
      Config: { Image: 'gladysassistant/gladys:v4.83.0' },
    });

    const gladysImage = await system.getGladysImage();
    expect(gladysImage).to.deep.equal({
      container_name: 'gladys',
      image: 'gladysassistant/gladys:v4.83.0',
      tag: 'v4.83.0',
      pinned: true,
      recommended_image: 'gladysassistant/gladys:v4',
    });
  });

  it('should detect an image pinned on a digest', async () => {
    system.inspectContainer = fake.resolves({
      Name: '/gladys',
      Config: { Image: 'gladysassistant/gladys@sha256:abcdef' },
    });

    const gladysImage = await system.getGladysImage();
    expect(gladysImage).to.have.property('pinned', true);
    // no tag to derive the major from, the running version is used instead
    expect(gladysImage).to.have.property('recommended_image', 'gladysassistant/gladys:v4');
  });

  it('should handle a container started from a raw image id', async () => {
    system.inspectContainer = fake.resolves({
      Config: { Image: 'sha256:92e700688a85' },
    });

    const gladysImage = await system.getGladysImage();
    expect(gladysImage).to.deep.equal({
      // an unnamed container cannot be passed to Watchtower
      container_name: '',
      image: 'sha256:92e700688a85',
      tag: null,
      pinned: true,
      // no repository to build a moving tag from
      recommended_image: null,
    });
  });

  it('should cache the image description', async () => {
    system.inspectContainer = fake.resolves({
      Name: '/gladys',
      Config: { Image: 'gladysassistant/gladys:v4' },
    });

    await system.getGladysImage();
    await system.getGladysImage();

    assert.calledOnce(system.inspectContainer);
  });
});
