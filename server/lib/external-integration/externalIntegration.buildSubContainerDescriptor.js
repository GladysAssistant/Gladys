const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');
const {
  EXTERNAL_INTEGRATION_LABEL,
  SUB_CONTAINER_LABEL,
  PRIVATE_NETWORK_PREFIX,
  SUB_CONTAINER_MEMORY_DEFAULT_MB,
  SUB_CONTAINER_CPU_DEFAULT,
  SUB_CONTAINER_SHM_DEFAULT_MB,
  SUB_CONTAINER_PIDS_DEFAULT,
  SUB_CONTAINER_TMP_DEFAULT_MB,
} = require('./constants');

const BYTES_PER_MB = 1024 * 1024;

/**
 * @description Build the Docker descriptor of a declared sub-container, with
 * the same lockdown as the main container (CapDrop ALL, no-new-privileges,
 * supervisor-driven restart, bounded logs, PidsLimit, noexec tmpfs /tmp)
 * except: only the private network of the integration (never
 * `gladys-integrations`: no token, no host API access), volumes derived from
 * the integration data folder (the manifest never chooses a host path), host
 * ports chosen by Gladys,
 * devices = requested (manifest) ∩ granted (user) ∩ present (detection),
 * CapAdd = requested ∩ granted Linux capabilities (on top of CapDrop ALL),
 * and limits sized by the manifest within the validated bounds (memory, CPU,
 * /dev/shm, tasks, /tmp size — never the flags).
 * @param {object} service - The external integration service (plain object).
 * @param {object} entry - The sub-container declaration from the manifest.
 * @param {object} [options] - Options.
 * @param {object} [options.env] - Runtime env, merged over the manifest env.
 * @returns {Promise<object>} Resolve with the container descriptor.
 * @example
 * const descriptor = await gladys.externalIntegration.buildSubContainerDescriptor(service, entry);
 */
async function buildSubContainerDescriptor(service, entry, { env = {} } = {}) {
  const { basePathOnHost } = await this.system.getGladysBasePath();
  const timezone = (await this.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE)) || 'UTC';
  const cpuCfsSupported = await this.system.hasCpuCfsSupport();
  const networkName = `${PRIVATE_NETWORK_PREFIX}${service.selector}`;
  const finalEnv = { ...(entry.env || {}), ...env, TZ: timezone };
  // devices: requested ∩ granted ∩ present, resolved at every creation —
  // plugging a Coral then recreating the container is enough
  const grantedClasses = Array.isArray(service.granted_devices) ? service.granted_devices : [];
  const detectedClasses = await this.system.detectHardwareClasses();
  const devices = [];
  (entry.devices || [])
    .filter((hardwareClass) => grantedClasses.includes(hardwareClass))
    .forEach((hardwareClass) => {
      const detected = detectedClasses.find((detectedClass) => detectedClass.class === hardwareClass);
      ((detected && detected.paths) || []).forEach((path) => {
        devices.push({ PathOnHost: path, PathInContainer: path, CgroupPermissions: 'rwm' });
      });
    });
  // capabilities: requested ∩ granted, added back on top of CapDrop ALL —
  // the manifest allowlist is Docker's default set, never beyond it (C.1)
  const grantedCapabilities = Array.isArray(service.granted_capabilities) ? service.granted_capabilities : [];
  const capAdd = (entry.capabilities || []).filter((capability) => grantedCapabilities.includes(capability));
  // each volume is mounted from a host path DERIVED by the supervisor: a
  // sub-container cannot write outside the folder of its integration; the
  // main container sees these volumes under /data/containers/<name>/...
  const binds = (entry.volumes || []).map(
    (volume) =>
      `${basePathOnHost}/external-integrations/${service.selector}/containers/${entry.name}${volume}:${volume}`,
  );
  const assignments = await this.assignHostPorts(service);
  const exposedPorts = {};
  const portBindings = {};
  (entry.ports || []).forEach((port) => {
    const protocol = port.protocol || 'tcp';
    const portKey = `${port.container_port}/${protocol}`;
    exposedPorts[portKey] = {};
    portBindings[portKey] = [
      // LAN exposure is assumed and shown on the install screen
      { HostIp: '0.0.0.0', HostPort: String(assignments[`${entry.name}/${port.container_port}/${protocol}`]) },
    ];
  });
  const memoryInBytes = (entry.memory_mb || SUB_CONTAINER_MEMORY_DEFAULT_MB) * BYTES_PER_MB;
  return {
    name: `gladys-${service.selector}-${entry.name}`,
    Image: entry.docker_image,
    Labels: {
      // same reconciliation key as the main container: one filter catches
      // the whole group, even orphans after a crash mid-operation
      [EXTERNAL_INTEGRATION_LABEL]: service.selector,
      [SUB_CONTAINER_LABEL]: entry.name,
      // updates are driven by the supervisor: Watchtower must never
      // recreate this container behind Gladys' back
      'com.centurylinklabs.watchtower.enable': 'false',
    },
    Env: Object.keys(finalEnv).map((key) => `${key}=${finalEnv[key]}`),
    ...(entry.command ? { Cmd: entry.command } : {}),
    ...(Object.keys(exposedPorts).length > 0 ? { ExposedPorts: exposedPorts } : {}),
    HostConfig: {
      NetworkMode: networkName,
      RestartPolicy: { Name: 'no' },
      ReadonlyRootfs: entry.read_only !== false,
      CapDrop: ['ALL'],
      ...(capAdd.length > 0 ? { CapAdd: capAdd } : {}),
      SecurityOpt: ['no-new-privileges'],
      Memory: memoryInBytes,
      MemorySwap: memoryInBytes,
      // omitted on kernels without the CPU CFS scheduler (Synology DSM):
      // the daemon would reject the creation with an HTTP 400
      ...(cpuCfsSupported ? { NanoCpus: Math.round((entry.cpu || SUB_CONTAINER_CPU_DEFAULT) * 1e9) } : {}),
      ShmSize: (entry.shm_mb || SUB_CONTAINER_SHM_DEFAULT_MB) * BYTES_PER_MB,
      // anti fork-bomb, threads included: the ceiling is validated (C.1)
      PidsLimit: entry.pids_limit || SUB_CONTAINER_PIDS_DEFAULT,
      ...(binds.length > 0 ? { Binds: binds } : {}),
      // only the size is declarable: /tmp is never an execution path
      Tmpfs: { '/tmp': `rw,noexec,nosuid,size=${entry.tmp_mb || SUB_CONTAINER_TMP_DEFAULT_MB}m` },
      LogConfig: { Type: 'json-file', Config: { 'max-size': '10m', 'max-file': '2' } },
      ...(devices.length > 0 ? { Devices: devices } : {}),
      ...(Object.keys(portBindings).length > 0 ? { PortBindings: portBindings } : {}),
    },
    NetworkingConfig: {
      EndpointsConfig: {
        // DNS alias = the sub-container name: the main container simply
        // reaches `mqtt:1883` or `frigate:5000`
        [networkName]: { Aliases: [entry.name] },
      },
    },
    AttachStdin: false,
    AttachStdout: false,
    AttachStderr: false,
    Tty: false,
  };
}

module.exports = {
  buildSubContainerDescriptor,
};
