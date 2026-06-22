const { expect } = require('chai');
const sinon = require('sinon');

const { assert, fake } = sinon;

const { ensureNodeConnected } = require('../../../../services/matter/utils/ensureNodeConnected');

describe('Matter.ensureNodeConnected', () => {
  it('should not connect when node is already connected', async () => {
    const node = {
      isConnected: true,
      connect: fake(),
    };

    const isConnected = await ensureNodeConnected(node);

    assert.notCalled(node.connect);
    expect(isConnected).to.equal(true);
  });

  it('should connect and wait for initialization when node is disconnected', async () => {
    let resolveInitialized;
    const initialized = new Promise((resolve) => {
      resolveInitialized = resolve;
    });
    const node = {
      isConnected: false,
      connect: fake(),
      events: {
        initialized,
      },
    };

    const connectPromise = ensureNodeConnected(node, { nodeId: 12345n });
    await Promise.resolve();
    assert.calledOnce(node.connect);
    resolveInitialized();
    const isConnected = await connectPromise;
    expect(isConnected).to.equal(true);
  });

  it('should return false when connection times out', async () => {
    const node = {
      isConnected: false,
      connect: fake(),
      events: {
        initialized: new Promise(() => {}),
      },
    };

    const isConnected = await ensureNodeConnected(node, { timeoutMs: 10 });

    assert.calledOnce(node.connect);
    expect(isConnected).to.equal(false);
  });

  it('should return false when connect throws synchronously', async () => {
    const node = {
      isConnected: false,
      connect: () => {
        throw new Error('Connect failed');
      },
      events: {
        initialized: new Promise(() => {}),
      },
    };

    const isConnected = await ensureNodeConnected(node, { nodeId: 12345n });

    expect(isConnected).to.equal(false);
  });
});
