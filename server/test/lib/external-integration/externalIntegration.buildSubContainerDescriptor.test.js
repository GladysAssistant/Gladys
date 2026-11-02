const crypto = require('crypto');
const { expect } = require('chai');
const sinon = require('sinon').createSandbox();

const { fake } = sinon;

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
        // fingerprint of the effective grants: no CapAdd, the two devices
        'io.gladysassistant.grants': crypto
          .createHash('sha256')
          .update(JSON.stringify({ capAdd: [], devices: ['/dev/bus/usb', '/dev/dri'] }))
          .digest('hex'),
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
    expect(descriptor.HostConfig.PidsLimit).to.equal(100);
    expect(descriptor.HostConfig.Tmpfs).to.deep.equal({ '/tmp': 'rw,noexec,nosuid,size=64m' });
    expect(descriptor.HostConfig).to.not.have.property('Devices');
    expect(descriptor.HostConfig).to.not.have.property('PortBindings');
    expect(descriptor).to.not.have.property('ExposedPorts');
    expect(descriptor).to.not.have.property('Cmd');
    expect(descriptor.HostConfig.Binds).to.deep.equal([
      '/var/lib/gladysassistant/external-integrations/ext-dev-open-meteo-demo/containers/mqtt/mosquitto/config:/mosquitto/config',
      '/var/lib/gladysassistant/external-integrations/ext-dev-open-meteo-demo/containers/mqtt/mosquitto/data:/mosquitto/data',
    ]);
  });

  it('should apply the declared task and /tmp limits, the tmpfs flags staying fixed', async () => {
    const { externalIntegration } = buildSupervisor();
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    const entry = { ...TEST_CONTAINERS_MANIFEST.containers[1], pids_limit: 512, tmp_mb: 1024 };
    const descriptor = await externalIntegration.buildSubContainerDescriptor(service, entry);
    expect(descriptor.HostConfig.PidsLimit).to.equal(512);
    expect(descriptor.HostConfig.Tmpfs).to.deep.equal({ '/tmp': 'rw,noexec,nosuid,size=1024m' });
  });

  it('should add back the requested and granted capabilities only, on top of CapDrop ALL', async () => {
    const { externalIntegration } = buildSupervisor();
    // the user granted CHOWN and SETUID, plus KILL which this entry does
    // not request (another sub-container may)
    const service = await seedExternalService({
      manifest: TEST_CONTAINERS_MANIFEST,
      granted_capabilities: ['CHOWN', 'SETUID', 'KILL'],
    });
    const entry = { ...TEST_CONTAINERS_MANIFEST.containers[1], capabilities: ['CHOWN', 'SETGID', 'SETUID'] };
    const descriptor = await externalIntegration.buildSubContainerDescriptor(service, entry);
    expect(descriptor.HostConfig.CapDrop).to.deep.equal(['ALL']);
    expect(descriptor.HostConfig.CapAdd).to.deep.equal(['CHOWN', 'SETUID']);
    expect(descriptor.HostConfig.SecurityOpt).to.deep.equal(['no-new-privileges']);
  });

  it('should fail closed: a requested and granted capability outside the allowlist is never added', async () => {
    const { externalIntegration } = buildSupervisor();
    // stale or tampered stored manifest (or an allowlist narrowed by a
    // later Gladys): only the allowlisted names reach CapAdd
    const service = await seedExternalService({
      manifest: TEST_CONTAINERS_MANIFEST,
      granted_capabilities: ['CHOWN', 'NET_RAW', 'SYS_ADMIN'],
    });
    const entry = { ...TEST_CONTAINERS_MANIFEST.containers[1], capabilities: ['NET_RAW', 'CHOWN', 'SYS_ADMIN'] };
    const descriptor = await externalIntegration.buildSubContainerDescriptor(service, entry);
    expect(descriptor.HostConfig.CapAdd).to.deep.equal(['CHOWN']);
  });

  it('should fingerprint the effective grants, independently of their order', async () => {
    const { externalIntegration } = buildSupervisor();
    const entry = { ...TEST_CONTAINERS_MANIFEST.containers[1], capabilities: ['SETUID', 'CHOWN'] };
    const service = await seedExternalService({
      manifest: TEST_CONTAINERS_MANIFEST,
      granted_capabilities: ['CHOWN', 'SETUID'],
    });
    const reordered = await externalIntegration.getEffectiveSubContainerGrants(
      { ...service, granted_capabilities: ['SETUID', 'CHOWN'] },
      { ...entry, capabilities: ['CHOWN', 'SETUID'] },
    );
    const revoked = await externalIntegration.getEffectiveSubContainerGrants(
      { ...service, granted_capabilities: ['CHOWN'] },
      entry,
    );
    const descriptor = await externalIntegration.buildSubContainerDescriptor(service, entry);
    expect(descriptor.Labels['io.gladysassistant.grants']).to.equal(reordered.fingerprint);
    expect(revoked.fingerprint).to.not.equal(reordered.fingerprint);
    expect(revoked.capAdd).to.deep.equal(['CHOWN']);
  });

  it('should omit CapAdd when nothing requested is granted', async () => {
    const { externalIntegration } = buildSupervisor();
    const entry = { ...TEST_CONTAINERS_MANIFEST.containers[1], capabilities: ['CHOWN'] };
    // requested but never granted (null column: install without grant)
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    const descriptor = await externalIntegration.buildSubContainerDescriptor(service, entry);
    expect(descriptor.HostConfig.CapDrop).to.deep.equal(['ALL']);
    expect(descriptor.HostConfig).to.not.have.property('CapAdd');
  });

  it('should publish the 4 declared ports of a sub-container', async () => {
    const { externalIntegration, variable } = buildSupervisor();
    const ports = [
      { container_port: 8971, label: { en: 'Frigate UI' } },
      { container_port: 8554, label: { en: 'RTSP' }, browsable: false },
      { container_port: 8555, protocol: 'tcp', label: { en: 'WebRTC (TCP)' }, browsable: false },
      { container_port: 8555, protocol: 'udp', label: { en: 'WebRTC (UDP)' }, browsable: false },
    ];
    const manifest = {
      ...TEST_CONTAINERS_MANIFEST,
      containers: [{ ...TEST_CONTAINERS_MANIFEST.containers[1], ports }],
    };
    const service = await seedExternalService({ manifest });
    await variable.setValue(
      SUB_CONTAINER_PORTS_VARIABLE,
      JSON.stringify({
        'frigate/8971/tcp': 42001,
        'frigate/8554/tcp': 42002,
        'frigate/8555/tcp': 42003,
        'frigate/8555/udp': 42004,
      }),
      service.id,
    );
    const descriptor = await externalIntegration.buildSubContainerDescriptor(service, manifest.containers[0]);
    expect(descriptor.ExposedPorts).to.deep.equal({ '8971/tcp': {}, '8554/tcp': {}, '8555/tcp': {}, '8555/udp': {} });
    expect(descriptor.HostConfig.PortBindings).to.deep.equal({
      '8971/tcp': [{ HostIp: '0.0.0.0', HostPort: '42001' }],
      '8554/tcp': [{ HostIp: '0.0.0.0', HostPort: '42002' }],
      '8555/tcp': [{ HostIp: '0.0.0.0', HostPort: '42003' }],
      '8555/udp': [{ HostIp: '0.0.0.0', HostPort: '42004' }],
    });
  });

  it('should omit NanoCpus when the kernel has no CPU CFS support', async () => {
    const { externalIntegration } = buildSupervisor({
      system: {
        hasCpuCfsSupport: fake.resolves(false),
      },
    });
    const service = await seedExternalService({ manifest: TEST_CONTAINERS_MANIFEST });
    const entry = TEST_CONTAINERS_MANIFEST.containers[0];
    const descriptor = await externalIntegration.buildSubContainerDescriptor(service, entry);
    expect(descriptor.HostConfig).to.not.have.property('NanoCpus');
    expect(descriptor.HostConfig.Memory).to.equal(128 * 1024 * 1024);
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
