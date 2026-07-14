const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');
const { EXTERNAL_INTEGRATION_LABEL, INTEGRATIONS_NETWORK_NAME } = require('./constants');

// 256MB of RAM, MemorySwap = Memory means no swap: OOM kill -> supervised restart
const MEMORY_LIMIT_IN_BYTES = 256 * 1024 * 1024;
// 0.5 CPU: an integration cannot starve Gladys on a Raspberry Pi
const NANO_CPUS = 500000000;
// anti fork-bomb
const PIDS_LIMIT = 100;

/**
 * @description Build the locked-down Docker container descriptor of an
 * external integration (see RFC C.7 for the field by field rationale).
 * Never granted on purpose: no Devices, no Privileged, no Docker socket,
 * no host network, no published ports (the inbound channel is the outgoing
 * WebSocket of the integration).
 * @param {object} service - The external integration service.
 * @param {string} integrationToken - The integration JWT to inject in Env.
 * @returns {Promise<object>} Resolve with the container descriptor.
 * @example
 * const descriptor = await gladys.externalIntegration.buildContainerDescriptor(service, token);
 */
async function buildContainerDescriptor(service, integrationToken) {
  const { basePathOnHost } = await this.system.getGladysBasePath();
  const hostApiUrl = await this.getHostApiUrl();
  const timezone = (await this.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE)) || 'UTC';
  return {
    name: `gladys-${service.selector}`,
    Image: service.docker_image,
    Labels: {
      // reconciliation key at boot and after backup/restore
      [EXTERNAL_INTEGRATION_LABEL]: service.selector,
    },
    Env: [
      `GLADYS_HOST_API_URL=${hostApiUrl}`,
      `GLADYS_INTEGRATION_TOKEN=${integrationToken}`,
      `GLADYS_INTEGRATION_SELECTOR=${service.selector}`,
      `TZ=${timezone}`,
    ],
    HostConfig: {
      NetworkMode: INTEGRATIONS_NETWORK_NAME,
      // the supervisor restarts the container (backoff + state machine),
      // a Docker `always` policy would bypass it
      RestartPolicy: { Name: 'no' },
      ReadonlyRootfs: true,
      CapDrop: ['ALL'],
      SecurityOpt: ['no-new-privileges'],
      Memory: MEMORY_LIMIT_IN_BYTES,
      MemorySwap: MEMORY_LIMIT_IN_BYTES,
      NanoCpus: NANO_CPUS,
      PidsLimit: PIDS_LIMIT,
      // the only writable bind: local persistence of the integration,
      // survives container recreations, removed at uninstall
      Binds: [`${basePathOnHost}/external-integrations/${service.selector}:/data`],
      Tmpfs: { '/tmp': 'rw,noexec,nosuid,size=64m' },
      LogConfig: { Type: 'json-file', Config: { 'max-size': '10m', 'max-file': '2' } },
    },
    AttachStdin: false,
    AttachStdout: false,
    AttachStderr: false,
    Tty: false,
  };
}

module.exports = {
  buildContainerDescriptor,
};
