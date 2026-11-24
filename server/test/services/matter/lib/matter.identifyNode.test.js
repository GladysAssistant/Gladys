const sinon = require('sinon').createSandbox();
const { expect, assert: chaiAssert } = require('chai');

const { fake, assert } = sinon;

// eslint-disable-next-line import/no-unresolved
const { Identify } = require('@matter/main/clusters');

const MatterHandler = require('../../../../services/matter/lib');
const { BadParameters, NotFoundError } = require('../../../../utils/coreErrors');

describe('Matter.identifyNode', () => {
  let matterHandler;
  let identifyClusterClient;
  let node;

  beforeEach(() => {
    matterHandler = new MatterHandler({ job: { wrapper: fake.returns(null) } }, {}, {}, 'service-1');
    identifyClusterClient = { identify: fake.resolves(null) };
    const outlet = (number) => ({
      number,
      getClusterClientById: (id) => (id === Identify.Complete.id ? identifyClusterClient : undefined),
      getChildEndpoints: () => [],
    });
    node = {
      isConnected: true,
      getDevices: () => [
        outlet(1),
        outlet(2),
        { number: 3, getClusterClientById: () => undefined, getChildEndpoints: () => [] },
      ],
    };
    matterHandler.nodesMap.set(1234n, node);
  });

  afterEach(() => {
    sinon.reset();
  });

  it('should make every endpoint of the node identify itself', async () => {
    const result = await matterHandler.identifyNode(1234n);
    expect(result).to.deep.equal({ identified_endpoints: 2 });
    assert.calledTwice(identifyClusterClient.identify);
    assert.alwaysCalledWithExactly(identifyClusterClient.identify, { identifyTime: 15 });
  });

  it('should use the given duration', async () => {
    await matterHandler.identifyNode(1234n, { seconds: 5 });
    assert.alwaysCalledWithExactly(identifyClusterClient.identify, { identifyTime: 5 });
  });

  it('should refuse an unknown node', async () => {
    await chaiAssert.isRejected(matterHandler.identifyNode(5n), NotFoundError);
  });

  it('should refuse a node which can not identify itself', async () => {
    node.getDevices = () => [{ number: 1, getClusterClientById: () => undefined, getChildEndpoints: () => [] }];
    await chaiAssert.isRejected(matterHandler.identifyNode(1234n), BadParameters);
  });

  it('should tell when the node is unreachable', async () => {
    node.isConnected = false;
    node.connect = fake.throws(new Error('offline'));
    node.events = { stateChanged: { on: fake(), off: fake() } };
    await chaiAssert.isRejected(matterHandler.identifyNode(1234n), 'Matter: Node 1234 is unreachable');
    assert.notCalled(identifyClusterClient.identify);
  });
});
