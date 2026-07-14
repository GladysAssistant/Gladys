const { expect } = require('chai');

const { buildSupervisor, seedExternalService } = require('./testUtils.test');
const { generateIntegrationToken } = require('../../../utils/integrationToken');

describe('externalIntegration.buildContainerDescriptor', () => {
  it('should build the locked-down container descriptor', async () => {
    const { externalIntegration, variable } = buildSupervisor();
    await variable.setValue('TIMEZONE', 'Europe/Paris');
    const service = await seedExternalService();
    const token = generateIntegrationToken(service.id, 1, 'secret');
    const descriptor = await externalIntegration.buildContainerDescriptor(service, token);
    expect(descriptor).to.deep.equal({
      name: 'gladys-ext-dev-open-meteo-demo',
      Image: 'ghcr.io/john/gladys-open-meteo-demo:1.2.0',
      Labels: {
        'io.gladysassistant.external-integration': 'ext-dev-open-meteo-demo',
      },
      Env: [
        `GLADYS_HOST_API_URL=http://172.30.0.1:${process.env.SERVER_PORT || '80'}`,
        `GLADYS_INTEGRATION_TOKEN=${token}`,
        'GLADYS_INTEGRATION_SELECTOR=ext-dev-open-meteo-demo',
        'TZ=Europe/Paris',
      ],
      HostConfig: {
        NetworkMode: 'gladys-integrations',
        RestartPolicy: { Name: 'no' },
        ReadonlyRootfs: true,
        CapDrop: ['ALL'],
        SecurityOpt: ['no-new-privileges'],
        Memory: 268435456,
        MemorySwap: 268435456,
        NanoCpus: 500000000,
        PidsLimit: 100,
        Binds: ['/var/lib/gladysassistant/external-integrations/ext-dev-open-meteo-demo:/data'],
        Tmpfs: { '/tmp': 'rw,noexec,nosuid,size=64m' },
        LogConfig: { Type: 'json-file', Config: { 'max-size': '10m', 'max-file': '2' } },
      },
      AttachStdin: false,
      AttachStdout: false,
      AttachStderr: false,
      Tty: false,
    });
  });

  it('should default the timezone to UTC', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedExternalService();
    const descriptor = await externalIntegration.buildContainerDescriptor(service, 'token');
    expect(descriptor.Env).to.include('TZ=UTC');
  });
});
