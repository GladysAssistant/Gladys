const sinon = require('sinon').createSandbox();

const { fake, assert } = sinon;

const Gladys = require('../../lib');

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
});
