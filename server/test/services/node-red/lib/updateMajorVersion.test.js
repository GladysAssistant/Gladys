const sinon = require('sinon');

const { assert, fake } = sinon;

const NodeRedManager = require('../../../../services/node-red/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('NodeRed updateMajorVersion', () => {
  let nodeRedManager;
  let gladys;

  beforeEach(() => {
    gladys = {
      variable: {
        getValue: fake.resolves(null),
        setValue: fake.resolves(true),
      },
    };

    nodeRedManager = new NodeRedManager(gladys, serviceId);
    nodeRedManager.getConfiguration = fake.resolves({
      dockerNodeRedVersion: '5',
      availableMajorVersions: ['3', '4', '5'],
    });
    nodeRedManager.saveConfiguration = fake.resolves(true);
    nodeRedManager.isEnabled = fake.resolves(false);
    nodeRedManager.checkForContainerUpdates = fake.resolves(true);
    nodeRedManager.installContainer = fake.resolves(true);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should persist selected version even when resolved default already matches', async () => {
    await nodeRedManager.updateMajorVersion('5');

    assert.calledOnce(nodeRedManager.saveConfiguration);
    assert.calledWithMatch(nodeRedManager.saveConfiguration, sinon.match({ dockerNodeRedVersion: '5' }));
    assert.notCalled(nodeRedManager.checkForContainerUpdates);
    assert.notCalled(nodeRedManager.installContainer);
  });

  it('should recreate container when version changes and service is enabled', async () => {
    gladys.variable.getValue = fake.resolves('3');
    nodeRedManager.isEnabled = fake.resolves(true);

    await nodeRedManager.updateMajorVersion('5');

    assert.calledOnce(nodeRedManager.saveConfiguration);
    assert.calledOnce(nodeRedManager.checkForContainerUpdates);
    assert.calledOnce(nodeRedManager.installContainer);
  });
});
