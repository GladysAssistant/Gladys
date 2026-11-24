const sinon = require('sinon').createSandbox();
const { expect } = require('chai');

const { fake, assert } = sinon;

const MatterHandler = require('../../../../services/matter/lib');

describe('Matter.stop', () => {
  let matterHandler;

  beforeEach(() => {
    const gladys = {
      job: {
        wrapper: fake.returns(null),
      },
      variable: {
        setValue: fake.resolves(null),
      },
    };
    const MatterMain = {};
    const ProjectChipMatter = {};

    matterHandler = new MatterHandler(gladys, MatterMain, ProjectChipMatter, 'service-1');
  });

  it('should stop matter', async () => {
    matterHandler.commissioningController = {
      close: fake.resolves(null),
    };
    await matterHandler.stop();
    assert.calledOnce(matterHandler.commissioningController.close);
  });
  it('should stop following the nodes', async () => {
    matterHandler.commissioningController = {
      close: fake.resolves(null),
    };
    const unsubscribe = fake();
    const timer = setTimeout(() => {}, 100000);
    matterHandler.watchedNodes.set('1234', { node: {}, unsubscribers: [unsubscribe] });
    matterHandler.nodeStatuses.set('1234', { status: 'reconnecting', since: new Date(), available: true });
    matterHandler.nodeStatusTimers.set('1234', timer);
    matterHandler.unreachableDevicePaths.set('1234', new Set(['1:child_endpoint:3']));
    matterHandler.bridgedDevices.set('1234', new Map([['1:child_endpoint:3', 'Lamp']]));
    matterHandler.lastContacts.set('1234', new Date('2026-11-24T10:00:00.000Z'));
    await matterHandler.stop();
    // the last contacts are saved, and kept for when the controller starts again
    assert.calledOnceWithExactly(
      matterHandler.gladys.variable.setValue,
      'MATTER_LAST_CONTACTS',
      JSON.stringify({ 1234: '2026-11-24T10:00:00.000Z' }),
      'service-1',
    );
    expect(matterHandler.lastContacts.size).to.equal(1);
    assert.calledOnce(unsubscribe);
    expect(matterHandler.watchedNodes.size).to.equal(0);
    expect(matterHandler.nodeStatuses.size).to.equal(0);
    expect(matterHandler.nodeStatusTimers.size).to.equal(0);
    expect(matterHandler.unreachableDevicePaths.size).to.equal(0);
    expect(matterHandler.bridgedDevices.size).to.equal(0);
  });
  it('should do nothing when called by the process signal handler', async () => {
    // process.on('SIGTERM', this.stop) calls stop with process as this
    await matterHandler.stop.call({});
  });
});
