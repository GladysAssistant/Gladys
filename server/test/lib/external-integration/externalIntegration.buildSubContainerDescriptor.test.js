const { expect } = require('chai');

const { buildSupervisor, seedExternalService, TEST_CONTAINERS_MANIFEST } = require('./testUtils.test');
const { SUB_CONTAINER_PORTS_VARIABLE } = require('../../../lib/external-integration/constants');

describe('externalIntegration.buildSubContainerDescriptor', () => {
  it('should build the locked-down descriptor of a sub-container', async () => {
    const { externalIntegration, variable } = buildSupervisor();
    const service = await seedExternalService({
      manifest: TEST_CONTAINERS_MANIFEST,
      granted_devices: ['coral-usb', 'gpu'],
    });
    await variable.setValue('TIMEZONE', 'Europe/Paris');
    await variable.setValue(SUB_CONTAINER_PORTS_VARIABLE, JSON.stringify({ 'frigate/5000/tcp': 42115 }), service.id);
    const entry = TEST_CONTAINERS_MANIFEST.containers[1];
    const descriptor = await externalIntegration.buildSubContainerDescriptor(service, entry, {
      env: { FRIGATE_MQTT_PASSWORD: 's3cr3t' },
    });
    expect(descriptor).to.deep.equal({
      name: 'gladys-ext-dev-open-meteo-demo-frigate',
      Image: 'ghcr.io/blakeblackshear/frigate:0.14.1',
      Labels: {
        'io.gladysassistant.external-integration': 'ext-dev-open-meteo-demo',
        'io.gladysassistant.container': 'frigate',
        'com.centurylinklabs.watchtower.enable': 'false',
      },
      Env: ['LIBVA_DRIVER_NAME=i965', 'FRIGATE_MQTT_PASSWORD=s3cr3t', 'TZ=Europe/Paris'],
      Cmd: ['python3', '-u', '-m', 'frigate'],
      ExposedPorts: { '5000/tcp': {} },
      HostConfig: {
        NetworkMode: 'gladys-int-ext-dev-open-meteo-demo',
        RestartPolicy: { Name: 'no' },
        ReadonlyRootfs: false,
        CapDrop: ['ALL'],
        SecurityOpt: ['no-new-privileges'],
        Memory: 1024 * 1024 * 1024,
        MemorySwap: 1024 * 1024 * 1024,
        NanoCpus: 1000000000,
        ShmSize: 128 * 1024 * 1024,
        PidsLimit: 100,
        Binds: [
          '/var/lib/gladysassistant/external-integrations/ext-dev-open-meteo-demo/containers/frigate/config:/config',
        ],
        Tmpfs: { '/tmp': 'rw,noexec,nosuid,size=64m' },
        LogConfig: { Type: 'json-file', Config: { 'max-size': '10m', 'max-file': '2' } },
        Devices: [
          { PathOnHost: '/dev/bus/usb', PathInContainer: '/dev/bus/usb', CgroupPermissions: 'rwm' },
          { PathOnHost: '/dev/dri', PathInContainer: '/dev/dri', CgroupPermissions: 'rwm' },
        ],
        PortBindings: { '5000/tcp': [{ HostIp: '0.0.0.0', HostPort: '42115' }] },
      },
      NetworkingConfig: {
        EndpointsConfig: {
          'gladys-int-ext-dev-open-meteo-demo': { Aliases: ['frigate'] },
        },
      },
      AttachStdin: false,
      AttachStdout: false,
      AttachStderr: false,
      Tty: false,
    });
  });

  it('should apply the defaults and mount nothing when no class is granted', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    const entry = TEST_CONTAINERS_MANIFEST.containers[0];
    const descriptor = await externalIntegration.buildSubContainerDescriptor(service, entry);
    expect(descriptor.Env).to.deep.equal(['TZ=UTC']);
    expect(descriptor.HostConfig.ReadonlyRootfs).to.equal(true);
    expect(descriptor.HostConfig.Memory).to.equal(128 * 1024 * 1024);
    expect(descriptor.HostConfig.NanoCpus).to.equal(500000000);
    expect(descriptor.HostConfig.ShmSize).to.equal(64 * 1024 * 1024);
    expect(descriptor.HostConfig).to.not.have.property('Devices');
    expect(descriptor.HostConfig).to.not.have.property('PortBindings');
    expect(descriptor).to.not.have.property('ExposedPorts');
    expect(descriptor).to.not.have.property('Cmd');
    expect(descriptor.HostConfig.Binds).to.deep.equal([
      '/var/lib/gladysassistant/external-integrations/ext-dev-open-meteo-demo/containers/mqtt/mosquitto/config:/mosquitto/config',
      '/var/lib/gladysassistant/external-integrations/ext-dev-open-meteo-demo/containers/mqtt/mosquitto/data:/mosquitto/data',
    ]);
  });

  it('should not mount a granted class that is not detected', async () => {
    const { externalIntegration } = buildSupervisor({
      system: {
        detectHardwareClasses: async () => [
          { class: 'coral-usb', detected: false, paths: [] },
          { class: 'gpu', detected: false, paths: [] },
        ],
      },
    });
    const service = await seedExternalService({
      manifest: TEST_CONTAINERS_MANIFEST,
      granted_devices: ['coral-usb', 'gpu'],
    });
    const entry = TEST_CONTAINERS_MANIFEST.containers[1];
    const descriptor = await externalIntegration.buildSubContainerDescriptor(service, entry);
    expect(descriptor.HostConfig).to.not.have.property('Devices');
  });
});
