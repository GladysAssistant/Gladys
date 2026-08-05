const { expect } = require('chai');

const { isHostPowerManagementAvailable } = require('../../../lib/system/system.isHostPowerManagementAvailable');

describe('system.isHostPowerManagementAvailable', () => {
  it('should return true when a mechanism has been detected', () => {
    expect(isHostPowerManagementAvailable.call({ hostPowerManagement: 'docker-helper' })).to.equal(true);
    expect(isHostPowerManagementAvailable.call({ hostPowerManagement: 'local' })).to.equal(true);
  });

  it('should return false when no mechanism is available or detection has not run', () => {
    expect(isHostPowerManagementAvailable.call({ hostPowerManagement: null })).to.equal(false);
    expect(isHostPowerManagementAvailable.call({})).to.equal(false);
  });
});
