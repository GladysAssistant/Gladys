const sinon = require('sinon');
const { expect } = require('chai');

const { assert, fake } = sinon;
const proxyquire = require('proxyquire').noCallThru();

const mockPassword = require('../mockPassword');

const initNodeRed = proxyquire('../../../../services/node-red/lib/init', {
  '../../../utils/password': mockPassword,
});

const NodeRedManager = proxyquire('../../../../services/node-red/lib', {
  './init': initNodeRed,
});

const container = {
  id: 'docker-test',
};

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('NodeRed init', () => {
  let nodeRedManager;
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

    nodeRedManager = new NodeRedManager(gladys, {}, serviceId);

    nodeRedManager.getConfiguration = sinon.stub();
    nodeRedManager.saveConfiguration = sinon.stub();
    nodeRedManager.checkForContainerUpdates = sinon.stub();
    nodeRedManager.installContainer = sinon.stub();

    nodeRedManager.dockerBased = undefined;
    nodeRedManager.networkModeValid = undefined;
  });

  afterEach(() => {
    sinon.reset();
  });

  it('it should fail because not a Docker System', async () => {
    gladys.system.isDocker = fake.resolves(false);

    try {
      await nodeRedManager.init();
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal('SYSTEM_NOT_RUNNING_DOCKER');
    }

    expect(nodeRedManager.dockerBased).to.equal(false);
    assert.notCalled(nodeRedManager.getConfiguration);
    assert.notCalled(nodeRedManager.saveConfiguration);
    assert.notCalled(nodeRedManager.checkForContainerUpdates);
    assert.notCalled(nodeRedManager.installContainer);
  });

  it('it should fail because not a host network', async () => {
    gladys.system.getNetworkMode = fake.resolves('container');

    try {
      await nodeRedManager.init();
      assert.fail();
    } catch (e) {
      expect(e.message).to.equal('DOCKER_BAD_NETWORK');
    }

    expect(nodeRedManager.networkModeValid).to.equal(false);
    assert.notCalled(nodeRedManager.getConfiguration);
    assert.notCalled(nodeRedManager.saveConfiguration);
    assert.notCalled(nodeRedManager.checkForContainerUpdates);
    assert.notCalled(nodeRedManager.installContainer);
  });

  it('it should install containers', async () => {
    const config = {
      nodeRedPassword: 'nodeRedPassword',
    };
    nodeRedManager.getConfiguration.resolves({ ...config });

    await nodeRedManager.init();

    assert.calledOnceWithExactly(nodeRedManager.getConfiguration);
    assert.calledOnceWithExactly(nodeRedManager.saveConfiguration, config);
    assert.calledOnceWithExactly(nodeRedManager.checkForContainerUpdates, config);
    assert.calledOnceWithExactly(nodeRedManager.installContainer, config);
  });

  it('it should save node-red params', async () => {
    const config = {};
    nodeRedManager.getConfiguration.resolves({ ...config });

    await nodeRedManager.init();

    const expectedNewConfig = {
      nodeRedPassword: 'password',
      nodeRedUsername: 'admin',
    };

    assert.calledOnceWithExactly(nodeRedManager.getConfiguration);
    assert.calledOnce(nodeRedManager.saveConfiguration);
    assert.calledWithMatch(nodeRedManager.saveConfiguration, sinon.match(expectedNewConfig));
    assert.calledOnce(nodeRedManager.checkForContainerUpdates);
    assert.calledWithMatch(nodeRedManager.checkForContainerUpdates, sinon.match(expectedNewConfig));
    assert.calledOnce(nodeRedManager.installContainer);
    assert.calledWithMatch(nodeRedManager.installContainer, sinon.match(expectedNewConfig));
  });

  it('should not init if the service is not enabled', async () => {
    gladys.variable.getValue = fake.resolves('0');

    await nodeRedManager.init();

    assert.notCalled(nodeRedManager.getConfiguration);
    assert.notCalled(nodeRedManager.saveConfiguration);
    assert.notCalled(nodeRedManager.checkForContainerUpdates);
    assert.notCalled(nodeRedManager.installContainer);
  });
});
