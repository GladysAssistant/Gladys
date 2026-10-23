const crypto = require('crypto');

const { SUB_CONTAINER_CAPABILITIES } = require('./constants');

/**
 * @description Resolve the effective grants of a declared sub-container, the
 * single source of what reaches the Docker call: devices = requested
 * (manifest) ∩ granted (user) ∩ present (detection), CapAdd = requested ∩
 * granted ∩ SUB_CONTAINER_CAPABILITIES — fail-closed like the hardware
 * classes: a name outside the allowlist (stale or tampered stored manifest,
 * allowlist narrowed by a later Gladys) produces nothing. The fingerprint
 * (sha256 of the sorted CapAdd + device paths) is stored as a container
 * label so a start can tell whether the existing container still matches.
 * @param {object} service - The external integration service (plain object).
 * @param {object} entry - The sub-container declaration from the manifest.
 * @returns {Promise<object>} Resolve with { capAdd, devices, fingerprint }.
 * @example
 * const { capAdd, devices, fingerprint } = await gladys.externalIntegration.getEffectiveSubContainerGrants(
 *   service,
 *   entry,
 * );
 */
async function getEffectiveSubContainerGrants(service, entry) {
  // devices: resolved at every creation — plugging a Coral then recreating
  // the container is enough
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
  // capabilities: added back on top of CapDrop ALL, never outside the
  // need-based allowlist whatever the stored manifest says (C.1)
  const grantedCapabilities = Array.isArray(service.granted_capabilities) ? service.granted_capabilities : [];
  const capAdd = (entry.capabilities || []).filter(
    (capability) => grantedCapabilities.includes(capability) && SUB_CONTAINER_CAPABILITIES.includes(capability),
  );
  const fingerprint = crypto
    .createHash('sha256')
    .update(
      JSON.stringify({
        capAdd: [...capAdd].sort(),
        devices: devices.map((device) => device.PathOnHost).sort(),
      }),
    )
    .digest('hex');
  return { capAdd, devices, fingerprint };
}

module.exports = {
  getEffectiveSubContainerGrants,
};
