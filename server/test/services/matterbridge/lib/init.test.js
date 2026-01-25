const sinon = require('sinon');
const { expect } = require('chai');

const { assert, fake } = sinon;

const MatterbridgeManager = require('../../../../services/matterbridge/lib');

const container = {
  id: 'docker-test',
};

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('Matterbridge init', () => {
  let matterbridgeManager;
  let gladys;

  beforeEach(() => {
    gladys = {
      system: {
        getContainers: fake.resolves([container]),
        stopContainer: fake.resolves(true),
        isDocker: fake.resolves(true),
        getNetworkMode: fake.resolves('host'),
        restartContainer: fake.resolves(true),
      },
      variable: {
        getValue: fake.resolves('1'),
      },
    };

    matterbridgeManager = new MatterbridgeManager(gladys, serviceId);

    matterbridgeManager.getConfiguration = sinon.stub();
    matterbridgeManager.saveConfiguration = sinon.stub();
    matterbridgeManager.checkForContainerUpdates = sinon.stub();
    matterbridgeManager.installContainer = sinon.stub();

    matterbridgeManager.dockerBased = undefined;
    matterbridgeManager.networkModeValid = undefined;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('it should fail because not a Docker System', async () => {
    gladys.system.isDocker = fake.resolves(false);

    try {
      await matterbridgeManager.init();
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal('SYSTEM_NOT_RUNNING_DOCKER');
    }

    expect(matterbridgeManager.dockerBased).to.equal(false);
    assert.notCalled(matterbridgeManager.getConfiguration);
    assert.notCalled(matterbridgeManager.saveConfiguration);
    assert.notCalled(matterbridgeManager.checkForContainerUpdates);
    assert.notCalled(matterbridgeManager.installContainer);
  });

  it('it should fail because not a host network', async () => {
    gladys.system.getNetworkMode = fake.resolves('container');

    try {
      await matterbridgeManager.init();
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal('DOCKER_BAD_NETWORK');
    }

    expect(matterbridgeManager.networkModeValid).to.equal(false);
    assert.notCalled(matterbridgeManager.getConfiguration);
    assert.notCalled(matterbridgeManager.saveConfiguration);
    assert.notCalled(matterbridgeManager.checkForContainerUpdates);
    assert.notCalled(matterbridgeManager.installContainer);
  });

  it('it should install containers', async () => {
    const config = {
      dockerMatterbridgeVersion: '1',
    };
    matterbridgeManager.getConfiguration.resolves({ ...config });

    await matterbridgeManager.init();

    assert.calledOnceWithExactly(matterbridgeManager.getConfiguration);
    assert.calledOnceWithExactly(matterbridgeManager.saveConfiguration, config);
    assert.calledOnceWithExactly(matterbridgeManager.checkForContainerUpdates, config);
    assert.calledOnceWithExactly(matterbridgeManager.installContainer, config);
  });

  it('should not init if the service is not enabled', async () => {
    gladys.variable.getValue = fake.resolves('0');

    await matterbridgeManager.init();

    assert.notCalled(matterbridgeManager.getConfiguration);
    assert.notCalled(matterbridgeManager.saveConfiguration);
    assert.notCalled(matterbridgeManager.checkForContainerUpdates);
    assert.notCalled(matterbridgeManager.installContainer);
  });
});
