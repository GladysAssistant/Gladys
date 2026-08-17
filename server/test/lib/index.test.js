const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;

const Gladys = require('../../lib');
const { EVENTS } = require('../../utils/constants');

describe('gladys.start', () => {
  it('should fire the upgrade check without blocking the boot sequence', async function test() {
    this.timeout(15000);
    const gladys = Gladys({
      jwtSecret: 'secret',
      disableService: true,
      disableBrainLoading: true,
      disableSceneLoading: true,
      disableDeviceLoading: true,
      disableUserLoading: true,
      disableRoomLoading: true,
      disableAreaLoading: true,
      disableSchedulerLoading: true,
      disableJobInit: true,
      disableExternalIntegration: true,
      disableDuckDbMigration: true,
    });
    // the check is stubbed with a promise that only resolves once the test
    // releases it: if start() awaited the check, it would hang and time out —
    // resolving while the check is still pending proves the boot never waits
    let releaseCheck;
    const pendingCheck = new Promise((resolve) => {
      releaseCheck = resolve;
    });
    gladys.system.checkIfGladysUpgraded = fake.returns(pendingCheck);
    await gladys.start();
    assert.calledOnceWithExactly(gladys.system.checkIfGladysUpgraded, gladys.gateway);
    releaseCheck();
  });
  it('should start services without blocking the boot sequence, and emit the system start trigger once they are started', async function test() {
    this.timeout(15000);
    const gladys = Gladys({
      jwtSecret: 'secret',
      disableBrainLoading: true,
      disableSceneLoading: true,
      disableDeviceLoading: true,
      disableUserLoading: true,
      disableRoomLoading: true,
      disableAreaLoading: true,
      disableSchedulerLoading: true,
      disableJobInit: true,
      disableExternalIntegration: true,
      disableDuckDbMigration: true,
      disableGladysUpgradedCheck: true,
    });
    // same pattern as the upgrade check above: startAll is stubbed with a
    // promise that only resolves once the test releases it — if start()
    // awaited startAll, it would hang and time out. The SYSTEM.START trigger
    // must only be emitted once services are started, so "on startup" scenes
    // find their integrations ready.
    let releaseStartAll;
    const pendingStartAll = new Promise((resolve) => {
      releaseStartAll = resolve;
    });
    gladys.service.load = fake.resolves(null);
    gladys.service.startAll = fake.returns(pendingStartAll);
    const checkTriggerListener = fake();
    const triggerEmitted = new Promise((resolve) => {
      gladys.event.on(EVENTS.TRIGGERS.CHECK, (payload) => {
        checkTriggerListener(payload);
        resolve();
      });
    });
    await gladys.start();
    assert.calledOnceWithExactly(gladys.service.load, gladys);
    assert.calledOnce(gladys.service.startAll);
    assert.notCalled(checkTriggerListener);
    releaseStartAll();
    await triggerEmitted;
    assert.calledOnceWithExactly(checkTriggerListener, { type: EVENTS.SYSTEM.START });
  });
  it('should emit the system start trigger even when service.startAll fails globally', async function test() {
    this.timeout(15000);
    const gladys = Gladys({
      jwtSecret: 'secret',
      disableBrainLoading: true,
      disableSceneLoading: true,
      disableDeviceLoading: true,
      disableUserLoading: true,
      disableRoomLoading: true,
      disableAreaLoading: true,
      disableSchedulerLoading: true,
      disableJobInit: true,
      disableExternalIntegration: true,
      disableDuckDbMigration: true,
      disableGladysUpgradedCheck: true,
    });
    gladys.service.load = fake.resolves(null);
    gladys.service.startAll = fake.rejects(new Error('database error'));
    const checkTriggerListener = fake();
    const triggerEmitted = new Promise((resolve) => {
      gladys.event.on(EVENTS.TRIGGERS.CHECK, (payload) => {
        checkTriggerListener(payload);
        resolve();
      });
    });
    await gladys.start();
    await triggerEmitted;
    assert.calledOnceWithExactly(checkTriggerListener, { type: EVENTS.SYSTEM.START });
  });
});
