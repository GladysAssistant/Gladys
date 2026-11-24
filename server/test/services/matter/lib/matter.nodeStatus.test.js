const sinon = require('sinon').createSandbox();
const { expect } = require('chai');

const { fake, assert } = sinon;

const MatterHandler = require('../../../../services/matter/lib');
const { getStoredLastContact, getConnectionState } = require('../../../../services/matter/lib/matter.nodeStatus');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

describe('Matter.nodeStatus', () => {
  let matterHandler;
  let gladys;
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers(new Date('2026-11-24T10:00:00.000Z'));
    gladys = {
      job: {
        wrapper: fake.returns(null),
      },
      event: {
        emit: fake(),
      },
    };
    matterHandler = new MatterHandler(gladys, {}, {}, 'service-1');
  });

  afterEach(() => {
    clock.restore();
    sinon.reset();
  });

  const lastPayload = () => gladys.event.emit.lastCall.args[1].payload;

  it('should record a connected node and tell the fronts', () => {
    matterHandler.setNodeStatus(1234n, 0);
    assert.calledOnceWithExactly(gladys.event.emit, EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.MATTER.NODE_STATUS_CHANGED,
      payload: {
        node_id: '1234',
        status: 'connected',
        available: true,
        last_contact: new Date('2026-11-24T10:00:00.000Z'),
        unreachable_device_paths: [],
      },
    });
  });

  it('should ignore a state which does not change the status', () => {
    matterHandler.setNodeStatus(1234n, 0);
    matterHandler.setNodeStatus(1234n, 0);
    assert.calledOnce(gladys.event.emit);
  });

  it('should keep a reconnecting node available during the grace delay, then make it unavailable', async () => {
    matterHandler.setNodeStatus(1234n, 0);
    await clock.tickAsync(1000);
    matterHandler.setNodeStatus(1234n, 2);
    expect(lastPayload()).to.deep.include({ status: 'reconnecting', available: true });
    // the last contact is kept while reconnecting
    expect(lastPayload().last_contact).to.deep.equal(new Date('2026-11-24T10:00:00.000Z'));
    await clock.tickAsync(30000);
    assert.calledThrice(gladys.event.emit);
    expect(lastPayload()).to.deep.include({ status: 'reconnecting', available: false });
    expect(matterHandler.nodeStatusTimers.size).to.equal(0);
  });

  it('should not make a node unavailable when it came back during the grace delay', async () => {
    matterHandler.setNodeStatus(1234n, 2);
    await clock.tickAsync(10000);
    matterHandler.setNodeStatus(1234n, 0);
    await clock.tickAsync(30000);
    assert.calledTwice(gladys.event.emit);
    expect(lastPayload()).to.deep.include({ status: 'connected', available: true });
  });

  it('should not make a node unavailable when its reconnection was replaced by another one', async () => {
    matterHandler.setNodeStatus(1234n, 2);
    const timer = matterHandler.nodeStatusTimers.get('1234');
    // a reconnection started again: the former timer is not the current one anymore
    matterHandler.nodeStatuses.set('1234', { status: 'reconnecting', since: new Date(), available: true });
    matterHandler.nodeStatusTimers.delete('1234');
    clock.runToLast();
    expect(timer).to.not.equal(undefined);
    assert.calledOnce(gladys.event.emit);
  });

  it('should make an offline node unavailable at once, and an unknown state counts as offline', () => {
    matterHandler.setNodeStatus(1234n, 3, new Date('2026-11-20T08:00:00.000Z'));
    expect(lastPayload()).to.deep.include({
      status: 'waiting-for-discovery',
      available: false,
      last_contact: new Date('2026-11-20T08:00:00.000Z'),
    });
    matterHandler.setNodeStatus(1235n, 42);
    expect(lastPayload()).to.deep.include({ node_id: '1235', status: 'disconnected', available: false });
  });

  it('should record the last contact of a node', async () => {
    matterHandler.touchNode(1234n);
    expect(matterHandler.nodeStatuses.size).to.equal(0);
    matterHandler.setNodeStatus(1234n, 0);
    await clock.tickAsync(5000);
    matterHandler.touchNode(1234n);
    expect(matterHandler.getNodeStatus(1234n).last_contact).to.deep.equal(new Date('2026-11-24T10:00:05.000Z'));
  });

  it('should follow the reachability of the bridged devices', () => {
    matterHandler.setDeviceReachability(1234n, '1:child_endpoint:3', true);
    matterHandler.setDeviceReachability(1234n, '1:child_endpoint:3', undefined);
    assert.notCalled(gladys.event.emit);
    matterHandler.setDeviceReachability(1234n, '1:child_endpoint:3', false);
    expect(lastPayload()).to.deep.include({ node_id: '1234', unreachable_device_paths: ['1:child_endpoint:3'] });
    matterHandler.setDeviceReachability(1234n, '1:child_endpoint:3', false);
    assert.calledOnce(gladys.event.emit);
    matterHandler.setDeviceReachability(1234n, '1:child_endpoint:3', true);
    expect(lastPayload().unreachable_device_paths).to.deep.equal([]);
    assert.calledTwice(gladys.event.emit);
  });

  it('should give the status of a node not followed yet from matter.js', () => {
    expect(
      matterHandler.getNodeStatus(1234n, {
        connectionState: 0,
        state: { commissioning: { onlineAt: 1764000000000, offlineAt: 1763000000000 } },
      }),
    ).to.deep.equal({
      status: 'connected',
      available: true,
      since: null,
      last_contact: new Date(1764000000000),
      unreachable_device_paths: [],
    });
    expect(matterHandler.getNodeStatus(1234n, { isConnected: false, connectionState: 9 })).to.deep.include({
      status: 'disconnected',
      available: false,
      last_contact: null,
    });
    expect(matterHandler.getNodeStatus(1234n)).to.deep.include({ status: 'disconnected', last_contact: null });
  });

  it('should read the connection state and the last contact kept by matter.js', () => {
    expect(getConnectionState({ connectionState: 2 })).to.equal(2);
    expect(getConnectionState({ isConnected: true })).to.equal(0);
    expect(getConnectionState({ isConnected: false })).to.equal(1);
    expect(getStoredLastContact({})).to.equal(null);
    expect(getStoredLastContact({ state: { commissioning: { offlineAt: 1764000000000 } } })).to.deep.equal(
      new Date(1764000000000),
    );
    const throwingNode = {
      get state() {
        throw new Error('closed');
      },
    };
    expect(getStoredLastContact(throwingNode)).to.equal(null);
  });

  it('should forget the status of one node, or of all nodes', async () => {
    matterHandler.setNodeStatus(1234n, 2);
    matterHandler.setNodeStatus(1235n, 2);
    matterHandler.setDeviceReachability(1234n, '1:child_endpoint:3', false);
    matterHandler.bridgedDevices.set('1234', new Map());
    matterHandler.clearNodeStatuses(1234n);
    expect(Array.from(matterHandler.nodeStatuses.keys())).to.deep.equal(['1235']);
    expect(Array.from(matterHandler.nodeStatusTimers.keys())).to.deep.equal(['1235']);
    expect(matterHandler.unreachableDevicePaths.size).to.equal(0);
    expect(matterHandler.bridgedDevices.size).to.equal(0);
    matterHandler.clearNodeStatuses();
    expect(matterHandler.nodeStatuses.size).to.equal(0);
    expect(matterHandler.nodeStatusTimers.size).to.equal(0);
    // no timer left to make a forgotten node unavailable
    const emitted = gladys.event.emit.callCount;
    await clock.tickAsync(60000);
    expect(gladys.event.emit.callCount).to.equal(emitted);
  });
});
