const { expect } = require('chai');
const { fake } = require('sinon');

const { buildSupervisor } = require('./testUtils.test');

describe('externalIntegration.getHostApiUrl', () => {
  it('should return the pinned gateway URL in host network mode', async () => {
    const { externalIntegration } = buildSupervisor();
    const url = await externalIntegration.getHostApiUrl();
    expect(url).to.equal(`http://172.30.0.1:${parseInt(process.env.SERVER_PORT, 10) || 1443}`);
  });

  it('should read the effective gateway when the subnet was auto-assigned', async () => {
    const { externalIntegration } = buildSupervisor({
      system: {
        inspectNetwork: fake.resolves({ IPAM: { Config: [{ Gateway: '172.31.0.1' }] } }),
      },
    });
    const url = await externalIntegration.getHostApiUrl();
    expect(url).to.equal(`http://172.31.0.1:${parseInt(process.env.SERVER_PORT, 10) || 1443}`);
  });

  it('should fallback to the default gateway when the network cannot be inspected', async () => {
    const { externalIntegration } = buildSupervisor({
      system: {
        inspectNetwork: fake.rejects(new Error('NOT_FOUND')),
      },
    });
    const url = await externalIntegration.getHostApiUrl();
    expect(url).to.equal(`http://172.30.0.1:${parseInt(process.env.SERVER_PORT, 10) || 1443}`);
  });

  it('should use the gladys DNS alias when Gladys runs in bridge mode', async () => {
    const { externalIntegration } = buildSupervisor({
      system: {
        getNetworkMode: fake.resolves('bridge'),
      },
    });
    const url = await externalIntegration.getHostApiUrl();
    expect(url).to.equal(`http://gladys:${parseInt(process.env.SERVER_PORT, 10) || 1443}`);
  });

  it('should use host.docker.internal when Gladys runs as a host process', async () => {
    const { externalIntegration } = buildSupervisor({
      system: {
        getNetworkMode: fake.resolves('host-process'),
      },
    });
    const url = await externalIntegration.getHostApiUrl();
    expect(url).to.equal(`http://host.docker.internal:${parseInt(process.env.SERVER_PORT, 10) || 1443}`);
  });
});
