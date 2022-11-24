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

describe('system.getContainerDevices', () => {
  let system;

  beforeEach(async () => {
    system = new System(sequelize, event, config, job);
    await system.init();
    // Reset all fakes invoked within init call
    sinon.reset();
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should failed as not on docker env', async () => {
    system.dockerode = undefined;

    try {
      await system.getContainerDevices('fake_id');
      assert.fail('should have fail');
    } catch (e) {
      expect(e).be.instanceOf(PlatformNotCompatible);
    }
  });

  it('should return container devices', async () => {
    const devices = await system.getContainerDevices(
      'a8293feec54547a797aa2e52cc14b93f89a007d6c5608c587e30491feec8ee61',
    );
    assert.match(devices, [
      {
        PathOnHost: 'device_path',
      },
    ]);
  });

  it('should return empty list because no container found', async () => {
    system.dockerode.getContainer = fake.resolves(null);
    const devices = await system.getContainerDevices('fake_id');
    assert.match(devices, []);
  });

  it('should return empty list because inspect return null', async () => {
    system.dockerode.getContainer = fake.returns({
      inspect: fake.resolves(null),
    });
    const devices = await system.getContainerDevices('fake_id');
    assert.match(devices, []);
  });

  it('should return empty list because no devices found', async () => {
    system.dockerode.getContainer = fake.returns({
      inspect: fake.resolves({
        HostConfig: {
          Devices: [],
        },
      }),
    });
    const devices = await system.getContainerDevices(
      'a8293feec54547a797aa2e52cc14b93f89a007d6c5608c587e30491feec8ee61',
    );
    assert.match(devices, []);
  });
});
