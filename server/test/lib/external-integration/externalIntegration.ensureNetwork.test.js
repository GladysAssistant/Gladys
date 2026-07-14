const { assert: sinonAssert, fake } = require('sinon');

const { buildSupervisor } = require('./testUtils.test');

describe('externalIntegration.ensureNetwork', () => {
  it('should create the dedicated bridge with pinned subnet and icc disabled', async () => {
    const { externalIntegration, system } = buildSupervisor();
    await externalIntegration.ensureNetwork();
    sinonAssert.calledWith(system.createNetwork, 'gladys-integrations', {
      Options: {
        'com.docker.network.bridge.enable_icc': 'false',
      },
      IPAM: {
        Driver: 'default',
        Config: [
          {
            Subnet: '172.30.0.0/24',
            Gateway: '172.30.0.1',
          },
        ],
      },
    });
    sinonAssert.notCalled(system.connectToNetwork);
  });

  it('should attach the Gladys container with the gladys alias in bridge mode', async () => {
    const { externalIntegration, system } = buildSupervisor({
      system: {
        getNetworkMode: fake.resolves('bridge'),
      },
    });
    await externalIntegration.ensureNetwork();
    sinonAssert.calledWith(system.connectToNetwork, 'gladys-integrations', 'gladys-container-id', ['gladys']);
  });

  it('should not fail when the Gladys container cannot be attached', async () => {
    const { externalIntegration } = buildSupervisor({
      system: {
        getNetworkMode: fake.resolves('bridge'),
        connectToNetwork: fake.rejects(new Error('CANNOT_CONNECT')),
      },
    });
    await externalIntegration.ensureNetwork();
  });
});
