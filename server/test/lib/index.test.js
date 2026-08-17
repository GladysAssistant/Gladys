const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;

const Gladys = require('../../lib');
const { EVENTS } = require('../../utils/constants');

describe('gladys.start', () => {
  it('should fire the upgrade check without blocking the boot sequence, once the services are started', async function test() {
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
    });
    // startAll is stubbed with a promise that only resolves once the test
    // releases it: if start() awaited it, it would hang and time out —
    // resolving while startAll is still pending proves the boot never waits.
    // The upgrade notification goes through the outbound channels of the
    // user, so it must only be sent once those integrations are started.
    let releaseStartAll;
    const pendingStartAll = new Promise((resolve) => {
      releaseStartAll = resolve;
    });
    gladys.service.load = fake.resolves(null);
    gladys.service.startAll = fake.returns(pendingStartAll);
    const upgradeChecked = new Promise((resolve) => {
      gladys.system.checkIfGladysUpgraded = fake(() => resolve());
    });
    await gladys.start();
    assert.notCalled(gladys.system.checkIfGladysUpgraded);
    releaseStartAll();
    await upgradeChecked;
    assert.calledOnceWithExactly(gladys.system.checkIfGladysUpgraded, gladys.gateway);
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
  it('should load the scenes in the trigger store only once the services are started', async function test() {
    this.timeout(15000);
    const gladys = Gladys({
      jwtSecret: 'secret',
      disableBrainLoading: true,
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
    // while the integrations start, they replay the state of their devices:
    // the scenes must not be in the trigger store yet, otherwise a scene
    // could run while the other integrations are still down
    let releaseStartAll;
    const pendingStartAll = new Promise((resolve) => {
      releaseStartAll = resolve;
    });
    gladys.service.load = fake.resolves(null);
    gladys.service.startAll = fake.returns(pendingStartAll);
    const scenesLoaded = new Promise((resolve) => {
      gladys.scene.init = fake(() => {
        resolve();
        return Promise.resolve([]);
      });
    });
    await gladys.start();
    assert.notCalled(gladys.scene.init);
    releaseStartAll();
    await scenesLoaded;
    assert.calledOnce(gladys.scene.init);
  });
  it('should emit the system start trigger even when the scenes fail to load', async function test() {
    this.timeout(15000);
    const gladys = Gladys({
      jwtSecret: 'secret',
      disableBrainLoading: true,
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
    gladys.service.startAll = fake.resolves(null);
    gladys.scene.init = fake.rejects(new Error('database error'));
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
