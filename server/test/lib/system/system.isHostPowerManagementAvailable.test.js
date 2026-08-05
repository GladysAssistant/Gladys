const { expect } = require('chai');
const sinon = require('sinon');

const proxyquire = require('proxyquire').noCallThru();

describe('system.isHostPowerManagementAvailable', () => {
  let platformStub;

  afterEach(() => {
    if (platformStub) {
      platformStub.restore();
      platformStub = null;
    }
  });

  const load = (existsFake) => {
    const { isHostPowerManagementAvailable } = proxyquire('../../../lib/system/system.isHostPowerManagementAvailable', {
      fs: { existsSync: existsFake },
    });
    return isHostPowerManagementAvailable;
  };

  it('should return false when not on Linux', () => {
    platformStub = sinon.stub(process, 'platform').value('darwin');
    const isHostPowerManagementAvailable = load(() => true);
    expect(isHostPowerManagementAvailable()).to.equal(false);
  });

  it('should return true when binary and socket are present on Linux', () => {
    platformStub = sinon.stub(process, 'platform').value('linux');
    const isHostPowerManagementAvailable = load(() => true);
    expect(isHostPowerManagementAvailable()).to.equal(true);
  });

  it('should return false when the DBus socket is missing', () => {
    platformStub = sinon.stub(process, 'platform').value('linux');
    const isHostPowerManagementAvailable = load((p) => p.includes('dbus-send'));
    expect(isHostPowerManagementAvailable()).to.equal(false);
  });

  it('should return false when the dbus-send binary is missing', () => {
    platformStub = sinon.stub(process, 'platform').value('linux');
    const isHostPowerManagementAvailable = load((p) => p.includes('system_bus_socket'));
    expect(isHostPowerManagementAvailable()).to.equal(false);
  });
});
