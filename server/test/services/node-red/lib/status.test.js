const { expect } = require('chai');
const { fake } = require('sinon');

const NodeRedManager = require('../../../../services/node-red/lib');

const gladys = {
  variable: {
    getValue: fake.resolves('1'),
  },
};
const serviceId = 'f87b7af2-ca8e-44fc-b754-444354b42fee';

describe('NodeRed status', () => {
  // PREPARE
  let nodeRedManager;

  beforeEach(() => {
    nodeRedManager = new NodeRedManager(gladys, serviceId);
    nodeRedManager.nodeRedExist = true;
    nodeRedManager.nodeRedRunning = true;
    nodeRedManager.mqttRunning = true;
    nodeRedManager.gladysConnected = true;
    nodeRedManager.dockerBased = true;
    nodeRedManager.networkModeValid = false;
  });

  it('get status', async () => {
    // EXECUTE
    const result = await nodeRedManager.status();
    // ASSERT
    expect(result.nodeRedExist).that.equal(true);
    expect(result.nodeRedRunning).that.equal(true);
    expect(result.nodeRedEnabled).that.equal(true);
    expect(result.gladysConnected).that.equal(true);
    expect(result.dockerBased).that.equal(true);
    expect(result.networkModeValid).that.equal(false);
  });
});
