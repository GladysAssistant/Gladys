const sinon = require('sinon');
const { fake, assert } = require('sinon');

const NodeRedManager = require('../../../../services/node-red/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('NodeRed saveConfiguration', () => {
  let nodeRedManager;
  let gladys;

  beforeEach(() => {
    gladys = {
      variable: {
        setValue: fake.resolves('setValue'),
        destroy: fake.resolves('destroy'),
      },
    };

    nodeRedManager = new NodeRedManager(gladys, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should store all variables', async () => {
    const config = {
      nodeRedUsername: 'nodeRedUsername',
      nodeRedPassword: 'nodeRedPassword',
      dockerNodeRedVersion: 'dockerNodeRedVersion',
    };

    await nodeRedManager.saveConfiguration(config);

    assert.callCount(gladys.variable.setValue, 4);
    assert.calledWithExactly(gladys.variable.setValue, 'NODE_RED_USERNAME', config.nodeRedUsername, serviceId);
    assert.calledWithExactly(gladys.variable.setValue, 'NODE_RED_PASSWORD', config.nodeRedPassword, serviceId);
    assert.calledWithExactly(
      gladys.variable.setValue,
      'DOCKER_NODE_RED_VERSION',
      config.dockerNodeRedVersion,
      serviceId,
    );
    assert.calledWithExactly(gladys.variable.setValue, 'NODE_RED_PORT', '1881', serviceId);
  });

  it('should destroy all variables', async () => {
    const config = {};

    await nodeRedManager.saveConfiguration(config);

    assert.callCount(gladys.variable.destroy, 3);
    assert.calledWithExactly(gladys.variable.destroy, 'NODE_RED_USERNAME', serviceId);
    assert.calledWithExactly(gladys.variable.destroy, 'NODE_RED_PASSWORD', serviceId);
    assert.calledWithExactly(gladys.variable.destroy, 'DOCKER_NODE_RED_VERSION', serviceId);
  });
});
