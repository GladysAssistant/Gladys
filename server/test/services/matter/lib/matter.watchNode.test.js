const sinon = require('sinon').createSandbox();
const { expect } = require('chai');

const { fake, assert } = sinon;

const MatterHandler = require('../../../../services/matter/lib');

/**
 * @description An observable of a matter.js node event.
 * @returns {object} The observable, with its observers.
 * @example
 * const stateChanged = createObservable();
 */
function createObservable() {
  const observers = new Set();
  return {
    observers,
    on: fake((observer) => observers.add(observer)),
    off: fake((observer) => observers.delete(observer)),
    emit: (...args) => observers.forEach((observer) => observer(...args)),
  };
}

const createNode = (connectionState) => ({
  connectionState,
  isConnected: connectionState === 0,
  events: {
    stateChanged: createObservable(),
    connectionAlive: createObservable(),
    attributeChanged: createObservable(),
    eventTriggered: createObservable(),
  },
});

describe('Matter.watchNode', () => {
  let matterHandler;
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers(new Date('2026-11-24T10:00:00.000Z'));
    matterHandler = new MatterHandler(
      { job: { wrapper: fake.returns(null) }, event: { emit: fake() } },
      {},
      {},
      'service-1',
    );
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  it('should follow the state and the contacts of a node', async () => {
    const node = createNode(0);
    matterHandler.watchNode(1234n, node);
    expect(matterHandler.getNodeStatus(1234n)).to.deep.include({ status: 'connected', available: true });
    node.events.stateChanged.emit(1);
    expect(matterHandler.getNodeStatus(1234n)).to.deep.include({ status: 'disconnected', available: false });
    node.events.stateChanged.emit(0);
    await clock.tickAsync(2000);
    node.events.attributeChanged.emit({});
    expect(matterHandler.getNodeStatus(1234n).last_contact).to.deep.equal(new Date('2026-11-24T10:00:02.000Z'));
    await clock.tickAsync(2000);
    node.events.connectionAlive.emit();
    node.events.eventTriggered.emit({});
    expect(matterHandler.getNodeStatus(1234n).last_contact).to.deep.equal(new Date('2026-11-24T10:00:04.000Z'));
  });

  it('should not count the values replayed from the cache of an offline node as a contact', async () => {
    const node = createNode(0);
    matterHandler.watchNode(1234n, node);
    node.isConnected = false;
    node.events.stateChanged.emit(2);
    await clock.tickAsync(5000);
    node.events.attributeChanged.emit({});
    expect(matterHandler.getNodeStatus(1234n).last_contact).to.deep.equal(new Date('2026-11-24T10:00:00.000Z'));
  });

  it('should watch a node only once', () => {
    const node = createNode(0);
    matterHandler.watchNode(1234n, node);
    matterHandler.watchNode(1234n, node);
    assert.calledOnce(node.events.stateChanged.on);
  });

  it('should release the former object of a node given again by matter.js', () => {
    const formerNode = createNode(0);
    const node = createNode(2);
    matterHandler.watchNode(1234n, formerNode);
    matterHandler.watchNode(1234n, node);
    expect(formerNode.events.stateChanged.observers.size).to.equal(0);
    expect(formerNode.events.connectionAlive.observers.size).to.equal(0);
    expect(matterHandler.getNodeStatus(1234n)).to.deep.include({ status: 'reconnecting' });
    formerNode.events.stateChanged.emit(1);
    expect(matterHandler.getNodeStatus(1234n)).to.deep.include({ status: 'reconnecting' });
  });

  it('should watch a node without some events', () => {
    const node = { isConnected: true, events: { stateChanged: createObservable(), connectionAlive: {} } };
    matterHandler.watchNode(1234n, node);
    expect(matterHandler.watchedNodes.get('1234').unsubscribers).to.have.lengthOf(1);
    matterHandler.watchNode(1235n, { isConnected: false });
    expect(matterHandler.watchedNodes.get('1235').unsubscribers).to.have.lengthOf(0);
    expect(matterHandler.getNodeStatus(1235n)).to.deep.include({ status: 'disconnected' });
  });

  it('should stop watching one node, or all nodes', () => {
    const node = createNode(0);
    const otherNode = createNode(0);
    matterHandler.watchNode(1234n, node);
    matterHandler.watchNode(1235n, otherNode);
    matterHandler.unwatchNode(1234n);
    matterHandler.unwatchNode(9999n);
    expect(node.events.stateChanged.observers.size).to.equal(0);
    expect(Array.from(matterHandler.watchedNodes.keys())).to.deep.equal(['1235']);
    matterHandler.unwatchNode();
    expect(otherNode.events.stateChanged.observers.size).to.equal(0);
    expect(matterHandler.watchedNodes.size).to.equal(0);
  });
});
