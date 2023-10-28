const { expect } = require('chai');
const sinon = require('sinon');
const { fake, assert } = require('sinon');

const NodeRedManager = require('../../../../services/node-red/lib');

const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('NodeRed getConfiguration', () => {
  // PREPARE
  let nodeRedManager;
  let gladys;

  beforeEach(() => {
    gladys = {
      variable: {
        getValue: fake.resolves('fake'),
      },
    };

    nodeRedManager = new NodeRedManager(gladys, serviceId);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should load stored configuration', async () => {
    const result = await nodeRedManager.getConfiguration();

    assert.callCount(gladys.variable.getValue, 4);
    assert.calledWithExactly(gladys.variable.getValue, 'NODE_RED_USERNAME', serviceId);
    assert.calledWithExactly(gladys.variable.getValue, 'NODE_RED_PASSWORD', serviceId);
    assert.calledWithExactly(gladys.variable.getValue, 'DOCKER_NODE_RED_VERSION', serviceId);
    assert.calledWithExactly(gladys.variable.getValue, 'TIMEZONE');

    expect(result).to.deep.equal({
      dockerNodeRedVersion: 'fake',
      nodeRedPassword: 'fake',
      nodeRedUsername: 'fake',
      timezone: 'fake',
    });
  });
});
