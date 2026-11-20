const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { assert, fake } = sinon;

const { ensureNodeConnected, formatNodeLabel } = require('../../../../services/matter/utils/ensureNodeConnected');

/**
 * @description Build a disconnected node mock whose state observers can be triggered by the test.
 * @returns {object} The node mock.
 * @example
 * const node = createNode();
 */
function createNode() {
  const observers = new Set();
  return {
    isConnected: false,
    connect: fake(),
    observers,
    events: {
      // In matter.js, initialized is emitted once per node lifetime: it must not be awaited
      initialized: new Promise(() => {}),
      stateChanged: {
        on: fake((observer) => observers.add(observer)),
        off: fake((observer) => observers.delete(observer)),
      },
    },
    emitState(state) {
      observers.forEach((observer) => observer(state));
    },
  };
}

describe('Matter.ensureNodeConnected', () => {
  afterEach(() => {
    sinon.restore();
  });

  it('should not connect when node is already connected', async () => {
    const node = {
      isConnected: true,
      connect: fake(),
    };

    const isConnected = await ensureNodeConnected(node);

    assert.notCalled(node.connect);
    expect(isConnected).to.equal(true);
  });

  it('should wait for the Connected state of an already initialized node', async () => {
    const node = createNode();

    const connectPromise = ensureNodeConnected(node, { nodeId: 12345n });
    await Promise.resolve();
    assert.calledOnce(node.connect);
    // Intermediate states do not resolve the wait
    node.emitState(2);
    node.isConnected = true;
    node.emitState(0);
    const isConnected = await connectPromise;
    expect(isConnected).to.equal(true);
    expect(node.observers.size).to.equal(0);
  });

  it('should return true when the node connects synchronously', async () => {
    const node = createNode();
    node.connect = fake(() => {
      node.isConnected = true;
    });

    const isConnected = await ensureNodeConnected(node);

    expect(isConnected).to.equal(true);
    expect(node.observers.size).to.equal(0);
  });

  it('should return false when connection times out', async () => {
    const node = createNode();

    const isConnected = await ensureNodeConnected(node, { timeoutMs: 10 });

    assert.calledOnce(node.connect);
    expect(isConnected).to.equal(false);
    expect(node.observers.size).to.equal(0);
  });

  it('should return false when connect throws synchronously', async () => {
    const node = createNode();
    node.connect = () => {
      throw new Error('Connect failed');
    };

    const isConnected = await ensureNodeConnected(node, { nodeId: 12345n });

    expect(isConnected).to.equal(false);
    expect(node.observers.size).to.equal(0);
  });

  it('should format the node label', () => {
    expect(formatNodeLabel(12345n)).to.equal('node 12345');
    expect(formatNodeLabel(undefined)).to.equal('node');
  });
});
