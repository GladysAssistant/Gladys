const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;
const { PlatformNotCompatible } = require('../../../utils/coreErrors');
const { isOnHostNetwork } = require('../../../lib/system/system.isOnHostNetwork');

describe('system.isOnHostNetwork', () => {
  afterEach(() => {
    sinon.reset();
  });

  it('should return true when Gladys runs in a container on the host network', async () => {
    const system = { getNetworkMode: fake.resolves('host'), isOnHostNetwork };
    expect(await system.isOnHostNetwork()).to.equal(true);
  });

  it('should return true when Gladys runs as a plain process next to Docker', async () => {
    const system = { getNetworkMode: fake.resolves('host-process'), isOnHostNetwork };
    expect(await system.isOnHostNetwork()).to.equal(true);
  });

  it('should return true when Docker is not available at all', async () => {
    const system = {
      getNetworkMode: fake.rejects(new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER')),
      isOnHostNetwork,
    };
    expect(await system.isOnHostNetwork()).to.equal(true);
  });

  it('should return false when Gladys runs in a bridged container', async () => {
    const system = { getNetworkMode: fake.resolves('bridge'), isOnHostNetwork };
    expect(await system.isOnHostNetwork()).to.equal(false);
  });

  it('should return false when Gladys runs in a user-defined Docker network', async () => {
    const system = { getNetworkMode: fake.resolves('gladys-network'), isOnHostNetwork };
    expect(await system.isOnHostNetwork()).to.equal(false);
  });
});
