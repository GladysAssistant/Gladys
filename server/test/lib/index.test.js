const { expect } = require('chai');
const Promise = require('bluebird');

const Gladys = require('../../lib');
// system.init reads the version from the repository root package.json
const packageJson = require('../../../package.json');
const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

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
    // the check compares the stored version with the running one: seeding the
    // current version makes the voluntarily unawaited check a deterministic
    // no-op (the notification path itself is tested with the System unit)
    const currentVersion = `v${packageJson.version}`;
    await gladys.variable.setValue(SYSTEM_VARIABLE_NAMES.GLADYS_VERSION, currentVersion);
    await gladys.start();
    // let the floating check finish before other tests touch the database
    await Promise.delay(100);
    expect(await gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.GLADYS_VERSION)).to.equal(currentVersion);
  });
});
