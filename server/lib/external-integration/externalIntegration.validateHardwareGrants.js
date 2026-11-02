const { Error422 } = require('../../utils/httpErrors');
const { SUB_CONTAINER_CAPABILITIES } = require('./constants');

/**
 * @description Check a grant list against what the manifest requests: an
 * array of strings, every item requested by at least one sub-container.
 * @param {Array} entries - The `containers[]` entries of the manifest.
 * @param {Array} granted - The granted items sent by the UI.
 * @param {string} field - The manifest field of the requests (`devices` or
 * `capabilities`).
 * @param {string} bodyField - The body field named in the error.
 * @param {string} itemLabel - What an item is, for the error message.
 * @param {Array} [allowlist] - When set, only these items count as requested
 * (fail-closed: a stale or tampered stored manifest requesting a name
 * outside the allowlist cannot get it granted).
 * @example
 * checkGrantList(entries, ['coral-usb'], 'devices', 'granted_devices', 'hardware classes');
 */
function checkGrantList(entries, granted, field, bodyField, itemLabel, allowlist) {
  if (!Array.isArray(granted) || granted.some((item) => typeof item !== 'string')) {
    throw new Error422(`${bodyField}: must be an array of ${itemLabel}`);
  }
  const requested = new Set();
  entries.forEach((entry) => {
    (entry[field] || [])
      .filter((item) => !allowlist || allowlist.includes(item))
      .forEach((item) => requested.add(item));
  });
  const unknownItems = granted.filter((item) => !requested.has(item));
  if (unknownItems.length > 0) {
    throw new Error422(`${bodyField}: ${unknownItems.join(', ')} not requested by the manifest`);
  }
}

/**
 * @description Validate the grants of the user — hardware classes and Linux
 * capabilities — against the requests of the manifest sub-containers:
 * requesting is done by the manifest, granting is a user gesture, and a
 * grant can never name something the manifest did not request (422), nor a
 * capability outside SUB_CONTAINER_CAPABILITIES even if the stored manifest
 * requests it (422). An omitted list is not checked (left unchanged by the
 * caller).
 * @param {Array} entries - The `containers[]` entries of the manifest.
 * @param {object} grants - The grants.
 * @param {Array} [grants.grantedDevices] - The granted hardware classes.
 * @param {Array} [grants.grantedCapabilities] - The granted Linux capabilities.
 * @example
 * gladys.externalIntegration.validateHardwareGrants(manifest.containers, { grantedCapabilities: ['CHOWN'] });
 */
function validateHardwareGrants(entries, { grantedDevices, grantedCapabilities } = {}) {
  if (grantedDevices !== undefined) {
    checkGrantList(entries, grantedDevices, 'devices', 'granted_devices', 'hardware classes');
  }
  if (grantedCapabilities !== undefined) {
    checkGrantList(
      entries,
      grantedCapabilities,
      'capabilities',
      'granted_capabilities',
      'Linux capabilities',
      SUB_CONTAINER_CAPABILITIES,
    );
  }
}

module.exports = {
  validateHardwareGrants,
};
